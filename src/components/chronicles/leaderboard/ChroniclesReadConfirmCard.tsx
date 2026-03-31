'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { kasToSompi } from '@/lib/ads/config';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import type { ChroniclesLbEntityType } from '@/lib/chronicles/leaderboard/constants';
import { CHRONICLES_LB_READ_CONFIRM_KAS } from '@/lib/chronicles/leaderboard/constants';
import {
  buildChroniclesLbReadConfirmText,
  chroniclesLbPayloadHexFromText,
} from '@/lib/chronicles/leaderboard/payload';
import { getLocalReadConfirmed, recordLocalPendingTx, recordLocalRead } from '@/lib/chronicles/leaderboard/localState';
import { Tooltip } from '@/components/ui/Tooltip';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { chroniclesLbEffectivePriceKas } from '@/lib/chronicles/leaderboard/pricing';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

async function verifyLoop(
  txHash: string,
  payerKaspa: string
): Promise<{ ok: true; txHash: string; txTimeMs: number } | { ok: false; error: string }> {
  let last: string | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const res = await fetch('/api/chronicles/leaderboard/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, payerAddress: payerKaspa }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; txHash?: string; txTimeMs?: number };
      if (j.ok) return { ok: true, txHash: String(j.txHash ?? txHash), txTimeMs: Number(j.txTimeMs ?? Date.now()) };
      const msg = (j.error ?? '').toLowerCase();
      const indexing = msg.includes('not found');
      if (!indexing) return { ok: false, error: j.error ?? 'Verification failed.' };
      last = attempt < 9 ? 'Waiting for the network indexer…' : j.error ?? 'Still not indexed; retry shortly.';
    } catch {
      last = attempt < 9 ? 'Waiting for verification…' : 'Could not reach the server.';
    }
    if (attempt < 9) await new Promise((r) => setTimeout(r, 1400 + attempt * 400));
  }
  return { ok: false, error: last ?? 'Verification failed.' };
}

export function ChroniclesReadConfirmCard({
  entityType,
  entityId,
  title = 'Read confirmed',
}: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  title?: string;
}) {
  const { state } = useKaspaWallet();
  const { tier } = useKREXBalance();
  const payerKaspa = state.address ? normAddr(state.address) : '';
  const readConfirmPriceKas = chroniclesLbEffectivePriceKas(CHRONICLES_LB_READ_CONFIRM_KAS, tier);
  const [localBump, setLocalBump] = useState(0);
  useEffect(() => {
    const on = () => setLocalBump((x) => x + 1);
    window.addEventListener('chronicles-lb-local', on as EventListener);
    return () => window.removeEventListener('chronicles-lb-local', on as EventListener);
  }, []);

  const confirmed = useMemo(() => {
    if (!payerKaspa) return false;
    return getLocalReadConfirmed(payerKaspa, entityType, entityId);
  }, [payerKaspa, entityType, entityId, localBump]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const treasury = getChroniclesVaultTreasuryL1Address();

  async function confirmRead() {
    setError(null);
    setNote(null);
    if (confirmed) return;
    if (!state.isConnected || !state.provider || !payerKaspa) {
      setError('Connect KasWare to confirm your read.');
      return;
    }
    setBusy(true);
    try {
      const text = buildChroniclesLbReadConfirmText({ entityType, entityId, payerKaspa });
      const txRes = await sendKaspaTransaction(state.provider as KaspaWalletProvider, {
        to: treasury,
        amount: String(kasToSompi(readConfirmPriceKas)),
        payload: chroniclesLbPayloadHexFromText(text),
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Transaction was rejected or failed');
      }
      const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
      recordLocalPendingTx(payerKaspa, hash, 'read');
      const vr = await verifyLoop(hash, payerKaspa);
      if (!vr.ok) throw new Error(vr.error);
      recordLocalRead(payerKaspa, entityType, entityId, { txHash: vr.txHash, txTimeMs: vr.txTimeMs });
      setNote('Read confirmed on-chain.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirmation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-3 chronicles-vault-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">{title}</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Confirm you read this content with an on-chain action. Base cost is {CHRONICLES_LB_READ_CONFIRM_KAS} KAS and your
            holder price ({tier}) is {readConfirmPriceKas} KAS.
          </p>
        </div>
        <Tooltip content="See leaderboard" side="top" align="end">
          <a href="/chronicles/leaderboard" className="k-control-btn shrink-0">
            Leaderboard
          </a>
        </Tooltip>
      </div>

      {confirmed ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Confirmed
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void confirmRead()}
          disabled={!state.isConnected || busy}
          className="k-control-btn text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        >
          {busy ? 'Confirming…' : `Confirm read (${readConfirmPriceKas} KAS)`}
        </button>
      )}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {note ? <p className="text-sm text-amber-700 dark:text-amber-400">{note}</p> : null}
    </div>
  );
}

