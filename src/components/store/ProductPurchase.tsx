'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { recordPurchase } from '@/lib/store/purchases';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useHubAccess } from '@/hooks/useHubAccess';
import type { Product } from '@/lib/store/types';

interface ProductPurchaseProps {
  product: Product;
  onPurchaseComplete?: () => void;
}

const STORE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function ProductPurchase({ product, onPurchaseComplete }: ProductPurchaseProps) {
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const gateConfig = { ...storeProductGateConfig(product), autoPrompt: true };
  const access = useHubAccess(gateConfig.requirement);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [feeCalculation, setFeeCalculation] = useState<ReturnType<typeof calculatePlatformFee> | null>(null);

  useEffect(() => {
    if (state.address) {
      const fee = calculatePlatformFee(
        product.priceKAS,
        krexTier,
        nftStatus
      );
      setFeeCalculation(fee);
    }
  }, [state.address, product.priceKAS, krexTier, nftStatus]);

  const handlePurchase = async () => {
    if (!access.isOpenable || !state.provider) {
      return;
    }

    if (!state.address) {
      setError('Wallet address not available');
      return;
    }

    if (!STORE_TREASURY_ADDRESS) {
      setError('Store treasury address not configured');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      const fee = calculatePlatformFee(product.priceKAS, krexTier, nftStatus);
      setFeeCalculation(fee);

      const sellerAmount = fee.sellerRevenue;
      const platformFee = fee.feeAmount;
      const totalAmount = product.priceKAS;

      const sellerSompis = kasToSompis(sellerAmount);
      const sellerTransaction = {
        to: product.sellerAddress,
        amount: sellerSompis.toString(),
      };

      const sellerResult = await sendKaspaTransaction(state.provider, sellerTransaction);
      if (sellerResult.status === 'failed') {
        throw new Error(sellerResult.error || 'Seller payment failed');
      }

      if (platformFee > 0) {
        const feeSompis = kasToSompis(platformFee);
        const feeTransaction = {
          to: STORE_TREASURY_ADDRESS,
          amount: feeSompis.toString(),
        };

        const feeResult = await sendKaspaTransaction(state.provider, feeTransaction);
        if (feeResult.status === 'failed') {
          console.warn('Platform fee payment failed:', feeResult.error);
        }
      }

      const purchaseTxHash = sellerResult.txHash;

      const purchaseResult = await recordPurchase({
        productId: product.id,
        buyerAddress: state.address,
        txHash: purchaseTxHash,
        amountPaidKAS: totalAmount,
        platformFeeKAS: platformFee,
        sellerRevenueKAS: sellerAmount,
      });

      if (!purchaseResult) {
        throw new Error('Failed to record purchase');
      }

      setTxHash(purchaseTxHash);
      setSuccess(true);

      try {
        const response = await fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: state.address,
            dappId: 'kasparex-store',
            actionType: 'product_purchase',
            actionValue: totalAmount,
            txHash: purchaseTxHash,
            network: 'L1',
          }),
        });

        if (!response.ok) {
          console.warn('Failed to record reward transaction:', await response.text());
        }
      } catch (rewardError) {
        console.error('Error recording reward:', rewardError);
      }

      if (onPurchaseComplete) {
        onPurchaseComplete();
      }

      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process purchase';
      setError(errorMessage);
      console.error('Product purchase error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const fee = feeCalculation || calculatePlatformFee(product.priceKAS, krexTier, nftStatus);

  return (
    <HubWalletGateShell config={gateConfig} mode="overlay">
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Purchase Product
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Complete your purchase to access the product content
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Product Price:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {product.priceKAS}
              </span>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
            </div>
          </div>
          {fee.feePercent > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Platform Fee ({fee.feePercent.toFixed(2)}%):</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {fee.feeAmount.toFixed(4)} KAS
                </span>
              </div>
              {fee.feePercent < 5 && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Discount applied (KREX/NFT holder)
                </div>
              )}
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {product.priceKAS}
                </span>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && txHash && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-300 mb-1">
              Purchase successful! Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              You now have access to the product content.
            </p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={isProcessing || success}
          className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-400 disabled:cursor-not-allowed text-zinc-950 rounded-xl font-bold transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : success ? (
            'Purchase Complete!'
          ) : (
            `Purchase for ${product.priceKAS} KAS`
          )}
        </button>
      </div>
    </div>
    </HubWalletGateShell>
  );
}
