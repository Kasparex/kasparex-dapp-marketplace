'use client';

import { useCallback, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { DAPP_LISTING_FEE_KAS } from '@/lib/dapps/listingSubmissions';
import { mergePricingTickers } from '@/lib/pricing';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';

const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function useDAppListingPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const publicTicks = useMemo(
    () =>
      listPublicVerifiedPaymentTokens()
        .filter((t) => t.kind === 'krc20' && t.tick)
        .map((t) => t.tick!),
    [],
  );
  const pricingTickers = useMemo(() => mergePricingTickers(['KREX', ...publicTicks]), [publicTicks]);
  const { snapshot: pricingSnapshot } = usePricingSnapshot(pricingTickers);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payFee = useCallback(
    async (currency: StorePaymentCurrency, feeKas: number, note?: string): Promise<string> => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect your Kaspa wallet to pay the listing fee');
      }
      if (!TREASURY) {
        throw new Error('Listing treasury address is not configured');
      }

      setIsProcessing(true);
      setError(null);

      try {
        const currencyId = String(currency || 'KAS').trim();

        if (currencyId.startsWith('kcc20:')) {
          throw new Error(
            'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
          );
        }

        if (currencyId === 'KREX') {
          const amountKrex = resolveTokenAmountFromKas(feeKas, 'KREX', pricingSnapshot);
          if (krexL1Balance + 1e-12 < amountKrex) {
            throw new Error('Insufficient KREX balance for listing fee');
          }
          return await transferKrc20(state.provider, {
            tick: 'KREX',
            amount: amountKrex,
            to: TREASURY,
          });
        }

        if (currencyId !== 'KAS') {
          const tick = currencyId.toUpperCase();
          const match = listPublicVerifiedPaymentTokens().find(
            (t) => t.kind === 'krc20' && (t.tick === tick || t.id === tick),
          );
          const amount = resolveTokenAmountFromKas(feeKas, tick, pricingSnapshot);
          return await transferKrc20(state.provider, {
            tick,
            amount,
            to: TREASURY,
            decimals: match?.decimals ?? 8,
          });
        }

        const plan = buildHubPlatformFeePlan({
          totalKas: feeKas,
          treasuryAddress: TREASURY,
          note,
        });
        const result = await payKasPaymentPlan(state.provider, plan, state.address);
        if (!result.txHash) {
          throw new Error('Listing fee payment failed');
        }
        return result.txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Listing fee payment failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.isConnected, state.address, state.provider, krexL1Balance, pricingSnapshot],
  );

  const payListingFee = useCallback(
    (currency: StorePaymentCurrency) => payFee(currency, DAPP_LISTING_FEE_KAS),
    [payFee],
  );

  const payActionFee = useCallback(
    (currency: StorePaymentCurrency, feeKas: number, note?: string) => payFee(currency, feeKas, note),
    [payFee],
  );

  return { payListingFee, payActionFee, isProcessing, error, setError };
}
