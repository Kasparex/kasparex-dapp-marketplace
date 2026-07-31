'use client';

import { useCallback, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import { expectedPriceKrexFromTotalKas } from '@/lib/ads/adPriceValidation';
import { sendAdsMetadataBindingTx } from '@/lib/ads/sendBindingTx';
import type { AdPaymentCurrency } from '@/lib/ads/metadata';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { listPublicVerifiedPaymentTokens } from '@/lib/payments/publicPaymentTokens';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { mergePricingTickers } from '@/lib/pricing';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

export function useAdsPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const publicTicks = useMemo(
    () =>
      listPublicVerifiedPaymentTokens()
        .filter((t) => t.kind === 'krc20' && t.tick)
        .map((t) => t.tick!),
    [],
  );
  const { snapshot: pricingSnapshot } = usePricingSnapshot(mergePricingTickers(['KREX', ...publicTicks]));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payAdCampaign = useCallback(
    async ({
      currency,
      priceKas,
      metadataCid,
      krexPaymentTxHash: existingKrexHash,
    }: {
      currency: AdPaymentCurrency;
      priceKas: number;
      metadataCid: string;
      /** When set, KREX transfer was already completed (metadata includes this hash). */
      krexPaymentTxHash?: string;
    }): Promise<{ txHash: string; krexPaymentTxHash?: string }> => {
      if (!state.provider || !state.address) {
        throw new Error('Connect your Kaspa (L1) wallet to pay.');
      }
      if (!getWalletProvider(state.provider)) {
        throw new Error('Wallet extension is not available. Refresh the page or reconnect your wallet.');
      }

      const treasuryAddress = getAdsTreasuryL1Address();
      const provider = state.provider as KaspaWalletProvider;
      const currencyId = String(currency || 'KAS').trim();

      setIsProcessing(true);
      setError(null);

      try {
        if (currencyId.startsWith('kcc20:')) {
          throw new Error(
            'KCC-20 Hub fee settlement is enabling next. Pay with KAS, KREX, or a KRC-20 for now.',
          );
        }

        if (currencyId === 'KREX') {
          const priceKrex = expectedPriceKrexFromTotalKas(priceKas, pricingSnapshot);
          let krexPaymentTxHash = existingKrexHash;
          if (!krexPaymentTxHash) {
            if (krexL1Balance + 1e-12 < priceKrex) {
              throw new Error('Insufficient KREX balance for this ad campaign');
            }
            const raw = await transferKrc20(provider, {
              tick: 'KREX',
              amount: priceKrex,
              to: treasuryAddress,
            });
            krexPaymentTxHash = extractKaspaTransactionId(raw) ?? raw;
          }
          const txHash = await sendAdsMetadataBindingTx(provider, metadataCid);
          return { txHash, krexPaymentTxHash };
        }

        if (currencyId !== 'KAS') {
          const tick = currencyId.toUpperCase();
          const match = listPublicVerifiedPaymentTokens().find(
            (t) => t.kind === 'krc20' && (t.tick === tick || t.id === tick),
          );
          const amount = resolveTokenAmountFromKas(priceKas, tick, pricingSnapshot);
          await transferKrc20(provider, {
            tick,
            amount,
            to: treasuryAddress,
            decimals: match?.decimals ?? 8,
          });
          const txHash = await sendAdsMetadataBindingTx(provider, metadataCid);
          return { txHash };
        }

        const txHash = await sendAdsMetadataBindingTx(provider, metadataCid, priceKas);
        return { txHash };
      } catch (err) {
        const message = formatKaspaWalletError(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [state.address, state.provider, krexL1Balance, pricingSnapshot],
  );

  return { payAdCampaign, isProcessing, error, setError };
}

export async function transferKrexForAdsPayment(
  provider: KaspaWalletProvider,
  priceKas: number,
  treasuryAddress: string,
  snapshot?: PricingSnapshot | null,
): Promise<string> {
  const priceKrex = expectedPriceKrexFromTotalKas(priceKas, snapshot);
  const raw = await transferKrc20(provider, {
    tick: 'KREX',
    amount: priceKrex,
    to: treasuryAddress,
  });
  return extractKaspaTransactionId(raw) ?? raw;
}

/** KREX amount for display and settlement (market rate with peg fallback). */
export function adsPriceKrexFromKas(priceKas: number, snapshot?: PricingSnapshot | null): number {
  return expectedPriceKrexFromTotalKas(priceKas, snapshot);
}
