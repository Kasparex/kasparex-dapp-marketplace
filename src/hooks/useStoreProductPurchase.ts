'use client';

import { useState, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { recordPurchase } from '@/lib/store/purchases';
import type { Product } from '@/lib/store/types';

const STORE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function useStoreProductPurchase(product: Product) {
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const purchase = useCallback(
    async (quantity: number = 1) => {
      if (!state.isConnected || !state.address || !state.provider) {
        setError('Connect your Kaspa wallet to purchase');
        return false;
      }

      if (!STORE_TREASURY_ADDRESS) {
        setError('Store treasury address not configured');
        return false;
      }

      const qty = Math.max(1, Math.floor(quantity));
      const unitPrice = product.priceKAS;
      const totalAmount = unitPrice * qty;

      setIsProcessing(true);
      setError(null);
      setSuccess(false);
      setTxHash(null);

      try {
        const fee = calculatePlatformFee(totalAmount, krexTier, nftStatus);
        const sellerAmount = fee.sellerRevenue;
        const platformFee = fee.feeAmount;

        const sellerResult = await sendKaspaTransaction(state.provider, {
          to: product.sellerAddress,
          amount: kasToSompis(sellerAmount).toString(),
        });

        if (sellerResult.status === 'failed') {
          throw new Error(sellerResult.error || 'Seller payment failed');
        }

        if (platformFee > 0) {
          const feeResult = await sendKaspaTransaction(state.provider, {
            to: STORE_TREASURY_ADDRESS,
            amount: kasToSompis(platformFee).toString(),
          });
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

        try {
          await fetch('/api/rewards/l1/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAddress: state.address,
              dappId: 'kasparex-store',
              actionType: 'product_purchase',
              actionValue: totalAmount,
              txHash: purchaseTxHash,
              network: 'L1',
            }),
          });
        } catch (rewardError) {
          console.error('Error recording reward:', rewardError);
        }

        setTxHash(purchaseTxHash);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setTxHash(null);
        }, 5000);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process purchase';
        setError(message);
        console.error('Product purchase error:', err);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, product, krexTier, nftStatus],
  );

  return { purchase, isProcessing, error, success, txHash, clearError: () => setError(null) };
}
