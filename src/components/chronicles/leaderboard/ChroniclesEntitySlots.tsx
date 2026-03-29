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
import { CHRONICLES_LB_SLOT_ACTIVATION_KAS, CHRONICLES_LB_SLOT_CHANGE_KAS } from '@/lib/chronicles/leaderboard/constants';
import {
  buildChroniclesLbActivateSlotText,
  buildChroniclesLbClearSlotText,
  buildChroniclesLbSetSlotText,
  chroniclesLbPayloadHexFromText,
} from '@/lib/chronicles/leaderboard/payload';
import {
  getLocalActivatedSlots,
  getLocalSlotPlacement,
  recordLocalActivate,
  recordLocalSetSlot,
} from '@/lib/chronicles/leaderboard/localState';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { Tooltip } from '@/components/ui/Tooltip';

type SlotIndex = 1 | 2 | 3;

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

async function verifyLoop(txHash: string, payerKaspa: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let last: string | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const res = await fetch('/api/chronicles/leaderboard/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, payerAddress: payerKaspa }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (j.ok) return { ok: true };
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

export function ChroniclesEntitySlots({
  entityType,
  entityId,
  title = 'NFT slots',
}: {
  entityType: Extract<ChroniclesLbEntityType, 'chapter' | 'character'>;
  entityId: string;
  title?: string;
}) {
  const { state } = useKaspaWallet();
  const payerKaspa = state.address ? normAddr(state.address) : '';
  const { nfts, isLoading: nftsLoading } = useNFTStatus();

  const [localBump, setLocalBump] = useState(0);
  useEffect(() => {
    const on = () => setLocalBump((x) => x + 1);
    window.addEventListener('chronicles-lb-local', on as EventListener);
    return () => window.removeEventListener('chronicles-lb-local', on as EventListener);
  }, []);

  const activeSlots = useMemo(() => {
    if (!payerKaspa) return new Set<SlotIndex>([1]);
    return getLocalActivatedSlots(payerKaspa, entityType, entityId);
  }, [payerKaspa, entityType, entityId, localBump]);

  const placement = (slotIndex: SlotIndex) =>
    payerKaspa ? getLocalSlotPlacement(payerKaspa, entityType, entityId, slotIndex) : null;

  const [busy, setBusy] = useState<SlotIndex | 'activate2' | 'activate3' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const treasury = getChroniclesVaultTreasuryL1Address();

  const nftOptions = useMemo(() => {
    return nfts
      .slice()
      .sort((a, b) => a.collection.localeCompare(b.collection) || a.tokenId - b.tokenId)
      .map((n) => ({ ref: `${n.collection}#${n.tokenId}`, label: `${n.collection} #${n.tokenId}` }));
  }, [nfts]);

  async function payAndVerify(text: string, amountKas: number) {
    if (!state.isConnected || !state.provider || !payerKaspa) throw new Error('Connect KasWare to continue.');
    const txRes = await sendKaspaTransaction(state.provider as KaspaWalletProvider, {
      to: treasury,
      amount: String(kasToSompi(amountKas)),
      note: text,
      payload: chroniclesLbPayloadHexFromText(text),
    });
    if (txRes.status === 'failed' || !txRes.txHash) throw new Error(txRes.error ?? 'Transaction was rejected or failed');
    const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
    const vr = await verifyLoop(hash, payerKaspa);
    if (!vr.ok) throw new Error(vr.error);
    return hash;
  }

  async function activate(slotIndex: 2 | 3) {
    setError(null);
    setNote(null);
    setBusy(slotIndex === 2 ? 'activate2' : 'activate3');
    try {
      const text = buildChroniclesLbActivateSlotText({ entityType, entityId, slotIndex, payerKaspa });
      await payAndVerify(text, CHRONICLES_LB_SLOT_ACTIVATION_KAS);
      recordLocalActivate(payerKaspa, entityType, entityId, slotIndex);
      setNote(`Slot ${slotIndex} activated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activation failed');
    } finally {
      setBusy(null);
    }
  }

  async function setSlot(slotIndex: SlotIndex, nftRef: string) {
    setError(null);
    setNote(null);
    if (!activeSlots.has(slotIndex)) {
      setError(`Slot ${slotIndex} is locked. Activate it first.`);
      return;
    }
    setBusy(slotIndex);
    try {
      const text = buildChroniclesLbSetSlotText({ entityType, entityId, slotIndex, nftRef, payerKaspa });
      await payAndVerify(text, CHRONICLES_LB_SLOT_CHANGE_KAS);
      recordLocalSetSlot(payerKaspa, entityType, entityId, slotIndex, nftRef);
      setNote(`Slot ${slotIndex} updated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Set failed');
    } finally {
      setBusy(null);
    }
  }

  async function clearSlot(slotIndex: SlotIndex) {
    setError(null);
    setNote(null);
    if (!activeSlots.has(slotIndex)) return;
    setBusy(slotIndex);
    try {
      const text = buildChroniclesLbClearSlotText({ entityType, entityId, slotIndex, payerKaspa });
      await payAndVerify(text, CHRONICLES_LB_SLOT_CHANGE_KAS);
      recordLocalSetSlot(payerKaspa, entityType, entityId, slotIndex, null);
      setNote(`Slot ${slotIndex} cleared.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-4 chronicles-vault-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">{title}</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Slot 1 is free. Slots 2-3 cost {CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS to activate. Setting or clearing a slot costs{' '}
            {CHRONICLES_LB_SLOT_CHANGE_KAS} KAS.
          </p>
        </div>
        <Tooltip content="See leaderboard" side="top" align="end">
          <a href="/chronicles/leaderboard" className="k-control-btn shrink-0">
            Leaderboard
          </a>
        </Tooltip>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {([1, 2, 3] as const).map((slotIndex) => {
          const isActive = activeSlots.has(slotIndex);
          const value = placement(slotIndex);
          const isThisBusy = busy === slotIndex;
          return (
            <div
              key={slotIndex}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/30 p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Slot {slotIndex}</p>
                {slotIndex !== 1 && !isActive ? (
                  <button
                    type="button"
                    onClick={() => void activate(slotIndex)}
                    disabled={!state.isConnected || busy != null}
                    className="k-control-btn h-9 text-xs font-bold uppercase tracking-wider"
                  >
                    Activate ({CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS)
                  </button>
                ) : (
                  <span className="text-[11px] font-black uppercase px-2 py-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {isActive ? 'Active' : 'Locked'}
                  </span>
                )}
              </div>

              {isActive ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Insert NFT</label>
                    <select
                      className="k-select !text-sm"
                      disabled={!state.isConnected || nftsLoading || isThisBusy || busy === 'activate2' || busy === 'activate3'}
                      value={value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        void setSlot(slotIndex, v);
                      }}
                    >
                      <option value="">{nftsLoading ? 'Loading NFTs…' : 'Select an NFT…'}</option>
                      {nftOptions.map((o) => (
                        <option key={o.ref} value={o.ref}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {value ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-mono text-zinc-700 dark:text-zinc-200 truncate">{value}</p>
                      <button
                        type="button"
                        onClick={() => void clearSlot(slotIndex)}
                        disabled={!state.isConnected || isThisBusy}
                        className="k-control-btn h-9 px-3 text-xs font-bold uppercase tracking-wider"
                      >
                        {isThisBusy ? 'Clearing…' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Empty slot.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Activate to insert an NFT.</p>
              )}
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {note ? <p className="text-sm text-amber-700 dark:text-amber-400">{note}</p> : null}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Treasury: <span className="font-mono">{treasury}</span>
      </p>
    </div>
  );
}

