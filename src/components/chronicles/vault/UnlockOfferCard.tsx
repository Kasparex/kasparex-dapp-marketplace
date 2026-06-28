'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { EntitlementOffer } from '@/lib/chronicles/entitlements/types';
import { ChroniclesLockCard } from './ChroniclesLockCard';
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
import { ChronicleThumb } from '@/components/chronicles/ChronicleFeaturedVisual';

export function UnlockOfferCard({
  offer,
  unlocked,
}: {
  offer: EntitlementOffer;
  unlocked: boolean;
}) {
  const { state } = useKaspaWallet();
  const { tier: krexTier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus, isLoading: nftLoading } = useNFTStatus();
  const [payError, setPayError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);

  const baseKas = offer.basePriceKas > 0 ? offer.basePriceKas : 0;
  const effectiveKas = useMemo(
    () => (baseKas > 0 ? vaultEffectivePriceKas(baseKas, krexTier, nftStatus) : 0),
    [baseKas, krexTier, nftStatus]
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

  async function handlePay() {
    setPayError(null);
    setVerifyNote(null);
    if (!state.isConnected || !state.provider || !payerNorm || baseKas <= 0) {
      setPayError('Connect your wallet to continue.');
      return;
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
      } else if (!lastMsg) {
        setPayError('Payment sent but not verified yet. Check again in a minute or contact support with your tx id.');
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPayBusy(false);
    }
  }

  const inner = (
    <div className="chronicles-vault-card rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden h-full flex flex-col">
      <ChronicleThumb imageUrl={offer.imageUrl} alt={offer.title} className="h-40 w-full shrink-0" />
      <div className="p-6 flex flex-col flex-1 min-h-0">
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-2">{offer.kind}</p>
        <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-lg mb-2 leading-snug">{offer.title}</h3>
        <p className="text-base text-zinc-700 dark:text-white/85 flex-1 leading-relaxed">{offer.shortDescription}</p>
        {baseKas > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{effectiveKas} KAS</span>
              {hasDiscount ? (
                <span className="text-sm font-mono text-zinc-400 line-through tabular-nums">{baseKas} KAS</span>
              ) : (
                <span className="text-sm font-mono text-zinc-500">{offer.priceLabel}</span>
              )}
            </div>

            {(krexDiscount > 0 || nftDiscount > 0) && (
              <div className="flex flex-wrap gap-2">
                {krexDiscount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    KREX −{krexDiscount}%
                  </span>
                ) : null}
                {nftDiscount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    NFT −{nftDiscount}%
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm font-mono text-zinc-500 mt-3">{offer.priceLabel}</p>
        )}

        {!unlocked && state.isConnected && baseKas > 0 ? (
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={payBusy || krexLoading}
              className="k-cta-primary w-full justify-center text-sm uppercase tracking-wide disabled:opacity-50 disabled:grayscale"
            >
              {payBusy ? 'Processing…' : `Pay ${effectiveKas} KAS`}
            </button>
            {payError ? <p className="text-sm text-red-600 dark:text-red-400">{payError}</p> : null}
            {verifyNote ? <p className="text-sm text-amber-700 dark:text-amber-400">{verifyNote}</p> : null}
          </div>
        ) : null}

        {unlocked && offer.targetHref ? (
          <Link
            href={offer.targetHref}
            className="mt-4 text-base font-bold text-[#02abb8] hover:underline inline-flex items-center gap-1"
          >
            Open
            <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    </div>
  );

  return (
    <ChroniclesLockCard
      locked={!unlocked}
      overlay="none"
      title={offer.title}
      description={offer.shortDescription}
      priceLabel={offer.priceLabel}
    >
      {inner}
    </ChroniclesLockCard>
  );
}
