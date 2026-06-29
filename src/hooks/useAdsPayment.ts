'use client';

import { useCallback, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction, getWalletProvider } from '@/lib/kaspa/wallet';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { kasToKrexAmount } from '@/lib/store/currencies';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import { ADS_KREX_BINDING_FEE_KAS } from '@/lib/ads/constants';
import { expectedPriceKrexFromTotalKas } from '@/lib/ads/adPriceValidation';
import { buildAdsBindingPayloadHex, buildAdsBindingPlainNote } from '@/lib/ads/payloadHex';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { AdPaymentCurrency } from '@/lib/ads/metadata';
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
  return signKrc20Transfer(
    provider,
    JSON.stringify(inscribeJson),
    KRC20_TRANSFER_TYPE,
    to,
    KREX_PRIORITY_FEE_KAS,
  );
}

export function useAdsPayment() {
  const { state } = useKaspaWallet();
  const { balance: krexL1Balance } = useKREXBalance();
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
      const payloadHex = buildAdsBindingPayloadHex(metadataCid);
      const plainNote = buildAdsBindingPlainNote(metadataCid);
      const provider = state.provider as KaspaWalletProvider;

      setIsProcessing(true);
      setError(null);

      try {
        if (currency === 'KREX') {
          const priceKrex = expectedPriceKrexFromTotalKas(priceKas);
          let krexPaymentTxHash = existingKrexHash;
          if (!krexPaymentTxHash) {
            if (krexL1Balance + 1e-12 < priceKrex) {
              throw new Error('Insufficient KREX balance for this ad campaign');
            }
            krexPaymentTxHash = await transferKrex(provider, priceKrex, treasuryAddress);
          }
          const bindingSompi = kasToSompi(ADS_KREX_BINDING_FEE_KAS);
          const txRes = await sendKaspaTransaction(provider, {
            to: treasuryAddress,
            amount: String(bindingSompi),
            note: plainNote,
            payload: payloadHex,
          });
          if (txRes.status === 'failed' || !txRes.txHash) {
            throw new Error(txRes.error ?? 'Binding transaction was rejected or failed');
          }
          const txHash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
          return { txHash, krexPaymentTxHash };
        }

        const amountSompi = kasToSompi(priceKas);
        const txRes = await sendKaspaTransaction(provider, {
          to: treasuryAddress,
          amount: String(amountSompi),
          note: plainNote,
          payload: payloadHex,
        });
        if (txRes.status === 'failed' || !txRes.txHash) {
          throw new Error(txRes.error ?? 'Transaction was rejected or failed');
        }
        const txHash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
        return { txHash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ad payment failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [state.address, state.provider, krexL1Balance],
  );

  return { payAdCampaign, isProcessing, error, setError };
}

export async function transferKrexForAdsPayment(
  provider: KaspaWalletProvider,
  priceKas: number,
  treasuryAddress: string,
): Promise<string> {
  const priceKrex = expectedPriceKrexFromTotalKas(priceKas);
  return transferKrex(provider, priceKrex, treasuryAddress);
}

/** KREX peg amount for display (matches on-chain settlement). */
export function adsPriceKrexFromKas(priceKas: number): number {
  return expectedPriceKrexFromTotalKas(priceKas);
}

/** Alias kept for callers that already import kasToKrexAmount semantics. */
export { kasToKrexAmount };
