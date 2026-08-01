'use client';

import { useState, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import { recordPurchase } from '@/lib/store/purchases';
import {
  getProductPaymentCurrency,
  getProductPriceOptions,
  isBuiltinStoreCurrency,
  krexToKasAmount,
} from '@/lib/store/currencies';
import type { Product } from '@/lib/store/types';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildCreatorPlatformPlan } from '@/lib/payments/paymentPlan';
import { splitTokenPayment } from '@/lib/payments/splitTokenPayment';
import { resolveTokenAmountFromKas, toKasEq } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

const STORE_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

function sameKaspaAddress(a: string, b: string): boolean {
  try {
    return normalizeKaspaAddress(a).toLowerCase() === normalizeKaspaAddress(b).toLowerCase();
  } catch {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
}

function resolvePayAmount(
  product: Product,
  quantity: number,
  payCurrency: string,
  pricingSnapshot?: PricingSnapshot | null,
): number {
  const qty = Math.max(1, Math.floor(quantity));
  const listed = getProductPaymentCurrency(product);
  if (listed === 'KAS' && payCurrency !== 'KAS') {
    return resolveTokenAmountFromKas(product.priceKAS, payCurrency, pricingSnapshot) * qty;
  }
  if (listed === 'KREX' && payCurrency === 'KAS') {
    const unitKas = toKasEq(product.priceKAS, 'KREX', pricingSnapshot) ?? krexToKasAmount(product.priceKAS);
    return unitKas * qty;
  }
  if (!isBuiltinStoreCurrency(listed) && isBuiltinStoreCurrency(payCurrency)) {
    const nativeKas = toKasEq(product.priceKAS, listed, pricingSnapshot) ?? product.priceKAS;
    if (payCurrency === 'KREX') {
      return resolveTokenAmountFromKas(nativeKas, 'KREX', pricingSnapshot) * qty;
    }
    return nativeKas * qty;
  }
  const option = getProductPriceOptions(product).find((o) => o.currency === payCurrency);
  return (option?.unitPrice ?? product.priceKAS) * qty;
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
    async (
      quantity: number = 1,
      payCurrency: string = getProductPaymentCurrency(product),
      pricingSnapshot?: PricingSnapshot | null,
    ) => {
      if (!state.isConnected || !state.address || !state.provider) {
        setError('Connect your Kaspa wallet to purchase');
        return false;
      }

      if (!STORE_TREASURY_ADDRESS) {
        setError('Store treasury address not configured');
        return false;
      }

      if (sameKaspaAddress(state.address, product.sellerAddress)) {
        setError('You cannot purchase your own listing');
        return false;
      }

      const totalPay = resolvePayAmount(product, quantity, payCurrency, pricingSnapshot);
      const totalKasEquivalent = toKasEq(totalPay, payCurrency, pricingSnapshot) ?? totalPay;

      setIsProcessing(true);
      setError(null);
      setSuccess(false);
      setTxHash(null);

      try {
        const fee = calculatePlatformFee(totalKasEquivalent, krexTier, nftStatus);

        let purchaseTxHash: string;

        if (!isBuiltinStoreCurrency(payCurrency) || payCurrency === 'KREX') {
          // Same economics as KAS: seller gets seller share in token; platform fee in KAS only.
          // Wallet prompt #1 = seller token amount (shown as the token part of Total to pay).
          // No second token transfer and no second full-value KAS charge.
          const { sellerToken } = splitTokenPayment(
            totalPay,
            fee.sellerRevenue,
            totalKasEquivalent,
          );

          if (payCurrency === 'KREX' && krexL1Balance + 1e-12 < sellerToken) {
            throw new Error('Insufficient KREX balance for this purchase');
          }

          purchaseTxHash = await transferKrc20(state.provider, {
            tick: payCurrency,
            amount: sellerToken,
            to: product.sellerAddress,
          });
          purchaseTxHash = extractKaspaTransactionId(purchaseTxHash) ?? purchaseTxHash;

          if (fee.feeAmount > 1e-9) {
            const feeResult = await sendKaspaTransaction(state.provider, {
              to: STORE_TREASURY_ADDRESS,
              amount: kasToSompis(fee.feeAmount).toString(),
              note: `Store purchase platform fee ${product.id}`,
            });
            if (feeResult.status === 'failed') {
              throw new Error(feeResult.error || 'Platform fee payment failed');
            }
          }
        } else {
          const plan = buildCreatorPlatformPlan({
            creatorAddress: product.sellerAddress,
            creatorKas: fee.sellerRevenue,
            creatorLabel: 'Seller',
            platformKas: fee.feeAmount,
            platformAddress: STORE_TREASURY_ADDRESS,
            note: `Store purchase ${product.id}`,
          });
          try {
            const multi = await payKasPaymentPlan(state.provider, plan, state.address);
            purchaseTxHash = multi.txHash;
          } catch {
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
