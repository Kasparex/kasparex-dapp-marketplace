'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import { expectedPriceKrexFromTotalKas } from '@/lib/ads/adPriceValidation';
import { sendAdsMetadataBindingTx } from '@/lib/ads/sendBindingTx';
import type { AdPaymentCurrency } from '@/lib/ads/metadata';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

const KREX_PRIORITY_FEE_KAS = 0.1;

async function transferKrex(
  provider: KaspaWalletProvider,
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
  const raw = await signKrc20Transfer(
    provider,
    JSON.stringify(inscribeJson),
    KRC20_TRANSFER_TYPE,
    to,
    KREX_PRIORITY_FEE_KAS,
  );
  const txId = extractKaspaTransactionId(raw) ?? (typeof raw === 'string' ? raw.trim() : null);
  if (!txId) {
    throw new Error('KREX transfer did not return a transaction id. Check KasWare history and retry.');
  }
  return txId;
}

export function useAdsPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);
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

      setIsProcessing(true);
      setError(null);

      try {
        if (currency === 'KREX') {
          const priceKrex = expectedPriceKrexFromTotalKas(priceKas, pricingSnapshot);
          let krexPaymentTxHash = existingKrexHash;
          if (!krexPaymentTxHash) {
            if (krexL1Balance + 1e-12 < priceKrex) {
              throw new Error('Insufficient KREX balance for this ad campaign');
            }
            krexPaymentTxHash = await transferKrex(provider, priceKrex, treasuryAddress);
          }
          const txHash = await sendAdsMetadataBindingTx(provider, metadataCid);
          return { txHash, krexPaymentTxHash };
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
  return transferKrex(provider, priceKrex, treasuryAddress);
}

/** KREX amount for display and settlement (market rate with peg fallback). */
export function adsPriceKrexFromKas(priceKas: number, snapshot?: PricingSnapshot | null): number {
  return expectedPriceKrexFromTotalKas(priceKas, snapshot);
}
