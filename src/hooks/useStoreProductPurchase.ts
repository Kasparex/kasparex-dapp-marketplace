'use client';

import { useState, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { recordPurchase } from '@/lib/store/purchases';
import {
  getProductPaymentCurrency,
  getProductPriceOptions,
  krexToKasAmount,
} from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';

const STORE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';
const KREX_PRIORITY_FEE_KAS = 0.1;

function resolvePayAmount(product: Product, quantity: number, payCurrency: GameItemCurrency): number {
  const qty = Math.max(1, Math.floor(quantity));
  const option = getProductPriceOptions(product).find((o) => o.currency === payCurrency);
  return (option?.unitPrice ?? product.priceKAS) * qty;
}

async function transferKrex(
  provider: NonNullable<ReturnType<typeof useKaspaWallet>['state']['provider']>,
  amountKrex: number,
  to: string,
): Promise<string> {
  const amountSmallest = Math.floor(amountKrex * Math.pow(10, KREX_DECIMALS));
  if (!Number.isFinite(amountSmallest) || amountSmallest <= 0) {
    throw new Error('KREX amount too small to transfer');
  }
  const inscribeJson = {
    p: 'KRC-20',
    op: 'transfer',
    tick: 'KREX',
    amt: amountSmallest.toString(),
    to,
  };
  return signKrc20Transfer(provider, JSON.stringify(inscribeJson), KRC20_TRANSFER_TYPE, to, KREX_PRIORITY_FEE_KAS);
}

export function useStoreProductPurchase(product: Product) {
  const { state } = useKaspaWallet();
  const { tier: krexTier, balance: krexL1Balance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const purchase = useCallback(
    async (quantity: number = 1, payCurrency: GameItemCurrency = getProductPaymentCurrency(product)) => {
      if (!state.isConnected || !state.address || !state.provider) {
        setError('Connect your Kaspa wallet to purchase');
        return false;
      }

      if (!STORE_TREASURY_ADDRESS) {
        setError('Store treasury address not configured');
        return false;
      }

      const totalPay = resolvePayAmount(product, quantity, payCurrency);
      const totalKasEquivalent =
        payCurrency === 'KREX' ? krexToKasAmount(totalPay) : totalPay;

      setIsProcessing(true);
      setError(null);
      setSuccess(false);
      setTxHash(null);

      try {
        const fee = calculatePlatformFee(totalKasEquivalent, krexTier, nftStatus);
        const sellerShare = fee.sellerRevenue / totalKasEquivalent;
        const platformShare = fee.feeAmount / totalKasEquivalent;

        let purchaseTxHash: string;

        if (payCurrency === 'KREX') {
          if (krexL1Balance + 1e-12 < totalPay) {
            throw new Error('Insufficient KREX balance for this purchase');
          }

          const sellerKrex = totalPay * sellerShare;
          const platformKrex = totalPay * platformShare;

          purchaseTxHash = await transferKrex(state.provider, sellerKrex, product.sellerAddress);

          if (platformKrex > 1e-9) {
            await transferKrex(state.provider, platformKrex, STORE_TREASURY_ADDRESS);
          }
        } else {
          const sellerResult = await sendKaspaTransaction(state.provider, {
            to: product.sellerAddress,
            amount: kasToSompis(fee.sellerRevenue).toString(),
          });

          if (sellerResult.status === 'failed') {
            throw new Error(sellerResult.error || 'Seller payment failed');
          }

          if (fee.feeAmount > 0) {
            const feeResult = await sendKaspaTransaction(state.provider, {
              to: STORE_TREASURY_ADDRESS,
              amount: kasToSompis(fee.feeAmount).toString(),
            });
            if (feeResult.status === 'failed') {
              console.warn('Platform fee payment failed:', feeResult.error);
            }
          }

          purchaseTxHash = sellerResult.txHash;
        }

        const purchaseResult = await recordPurchase({
          productId: product.id,
          buyerAddress: state.address,
          txHash: purchaseTxHash,
          amountPaidKAS: totalKasEquivalent,
          platformFeeKAS: fee.feeAmount,
          sellerRevenueKAS: fee.sellerRevenue,
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
              actionValue: totalKasEquivalent,
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
    [state.isConnected, state.address, state.provider, product, krexTier, nftStatus, krexL1Balance],
  );

  return { purchase, isProcessing, error, success, txHash, clearError: () => setError(null) };
}
