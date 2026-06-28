'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { kasToSompi } from '@/lib/ads/config';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import { buildVaultUnlockPayloadHex, buildVaultUnlockPlainNote } from '@/lib/chronicles/vault/payloadHex';
import {
  vaultEffectivePriceKas,
  krexTierDiscountPercent,
  chroniclesNftTierDiscountPercent,
} from '@/lib/chronicles/vault/pricing';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { recordVaultUnlock } from '@/lib/chronicles/vault/localUnlocks';
import type { EntitlementOffer } from '@/lib/chronicles/entitlements/types';

export function useChroniclesVaultUnlock(offer: EntitlementOffer | null | undefined) {
  const { state } = useKaspaWallet();
  const { tier: krexTier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [payError, setPayError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);

  const baseKas = offer && offer.basePriceKas > 0 ? offer.basePriceKas : 0;
  const effectiveKas = useMemo(
    () => (baseKas > 0 ? vaultEffectivePriceKas(baseKas, krexTier, nftStatus) : 0),
    [baseKas, krexTier, nftStatus],
  );

  const payerNorm = useMemo(() => {
    if (!state.address) return '';
    try {
      return normalizeKaspaAddress(state.address);
    } catch {
      return state.address.startsWith('kaspa:') ? state.address : `kaspa:${state.address}`;
    }
  }, [state.address]);

  const krexDiscount = baseKas > 0 ? krexTierDiscountPercent(krexTier) : 0;
  const nftDiscount = baseKas > 0 ? chroniclesNftTierDiscountPercent(nftStatus) : 0;
  const hasDiscount = baseKas > 0 && effectiveKas > 0 && effectiveKas < baseKas;

  async function payUnlock(): Promise<boolean> {
    setPayError(null);
    setVerifyNote(null);
    if (!offer || !state.isConnected || !state.provider || !payerNorm || baseKas <= 0) {
      setPayError('Connect your wallet to continue.');
      return false;
    }
    setPayBusy(true);
    try {
      const treasury = getChroniclesVaultTreasuryL1Address();
      const sompi = kasToSompi(effectiveKas);
      const payloadHex = buildVaultUnlockPayloadHex(offer.id, payerNorm);
      const note = buildVaultUnlockPlainNote(offer.id, payerNorm);
      const txRes = await sendKaspaTransaction(state.provider as KaspaWalletProvider, {
        to: treasury,
        amount: String(sompi),
        note,
        payload: payloadHex,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Payment was rejected or failed');
      }
      const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;

      let verified = false;
      let lastMsg: string | null = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const vr = await fetch('/api/chronicles/vault/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txHash: hash,
              offerId: offer.id,
              payerAddress: payerNorm,
              basePriceKas: baseKas,
            }),
          });
          const vj = (await vr.json()) as { ok?: boolean; error?: string };
          if (vj.ok) {
            verified = true;
            lastMsg = null;
            break;
          }
          const msg = (vj.error ?? '').toLowerCase();
          const indexing = msg.includes('not found');
          if (!indexing) {
            lastMsg = vj.error ?? 'Verification failed.';
            break;
          }
          lastMsg = attempt < 9 ? 'Waiting for the network indexer…' : vj.error ?? 'Still not indexed; retry shortly.';
        } catch {
          lastMsg = attempt < 9 ? 'Waiting for verification…' : 'Could not reach the server.';
        }
        if (verified) break;
        if (attempt < 9) {
          await new Promise((r) => setTimeout(r, 1400 + attempt * 400));
        }
      }
      setVerifyNote(lastMsg);
      if (verified) {
        recordVaultUnlock(payerNorm, offer.id, hash);
        return true;
      }
      if (!lastMsg) {
        setPayError('Payment sent but not verified yet. Check again in a minute or contact support with your tx id.');
      }
      return false;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
      return false;
    } finally {
      setPayBusy(false);
    }
  }

  return {
    baseKas,
    effectiveKas,
    krexDiscount,
    nftDiscount,
    hasDiscount,
    payError,
    payBusy,
    verifyNote,
    krexLoading,
    isConnected: state.isConnected,
    payUnlock,
    resetErrors: () => {
      setPayError(null);
      setVerifyNote(null);
    },
  };
}
