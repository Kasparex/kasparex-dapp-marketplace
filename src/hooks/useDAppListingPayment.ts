'use client';

import { useCallback, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { DAPP_LISTING_FEE_KAS } from '@/lib/dapps/listingSubmissions';
import { mergePricingTickers } from '@/lib/pricing';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
  payHubTokenListingFee,
} from '@/lib/payments/hubPayRail';

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

        if (currencyId !== 'KAS') {
          const tick = currencyId === 'KREX' ? 'KREX' : currencyId.toUpperCase();
          const amountToken = resolveTokenAmountFromKas(feeKas, tick, pricingSnapshot);
          if (tick === 'KREX' && krexL1Balance + 1e-12 < amountToken) {
            throw new Error('Insufficient KREX balance for listing fee');
          }
          const match = listPublicVerifiedPaymentTokens().find(
            (t) => t.kind === 'krc20' && (t.tick === tick || t.id === tick),
          );
          const paid = await payHubTokenListingFee({
            provider: state.provider,
            senderAddress: state.address,
            tick,
            feeKas,
            amountToken,
            treasuryAddress: TREASURY,
            pricingSnapshot,
            decimals: match?.decimals ?? 8,
            note,
          });
          return paid.kasCommitTxHash ?? paid.tokenTxHash;
        }

        const plan = buildHubKasListingPlan({
          feeKas,
          treasuryAddress: TREASURY,
          note,
        });
        return await payHubKasPlan({
          provider: state.provider,
          senderAddress: state.address,
          plan,
        });
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
