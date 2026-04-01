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
  getChroniclesAllPlacedNftRefs,
  getChroniclesNftUsageByRef,
  recordLocalPendingTx,
  recordLocalActivate,
  recordLocalSetSlot,
} from '@/lib/chronicles/leaderboard/localState';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { ChroniclesNftSlotSelector, chroniclesNftRefToCollectionAndId } from './ChroniclesNftSlotSelector';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { pointsForNftInSlot } from '@/lib/leaderboard/nftPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { chroniclesLbEffectivePriceKas } from '@/lib/chronicles/leaderboard/pricing';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  isStorageMassErrorMessage,
  readHighMassMode,
  retryKasCandidates,
  writeHighMassMode,
} from '@/lib/chronicles/leaderboard/massMode';

type SlotIndex = 1 | 2 | 3;

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
  const { tier } = useKREXBalance();
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
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<SlotIndex | null>(null);
  const [metaMap, setMetaMap] = useState<Record<string, ParsedNFTMetadata>>({});
  const [highMassMode, setHighMassMode] = useState(false);
  const activationPriceKas = chroniclesLbEffectivePriceKas(CHRONICLES_LB_SLOT_ACTIVATION_KAS, tier);
  const slotChangePriceKas = chroniclesLbEffectivePriceKas(CHRONICLES_LB_SLOT_CHANGE_KAS, tier);

  useEffect(() => {
    setHighMassMode(readHighMassMode());
  }, []);

  const nftOptions = useMemo(() => {
    return nfts
      .slice()
      .sort((a, b) => a.collection.localeCompare(b.collection) || a.tokenId - b.tokenId)
      .map((n) => ({ ref: `${n.collection}#${n.tokenId}`, label: `${n.collection} #${n.tokenId}` }));
  }, [nfts]);

  const allPlacementRefs = useMemo(() => {
    if (!payerKaspa) return new Set<string>();
    return getChroniclesAllPlacedNftRefs(payerKaspa);
  }, [payerKaspa, entityType, entityId, localBump]);

  const usageByRef = useMemo(() => {
    if (!payerKaspa) return {};
    return getChroniclesNftUsageByRef(payerKaspa);
  }, [payerKaspa, localBump]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next: Record<string, ParsedNFTMetadata> = {};
      for (const ref of allPlacementRefs) {
        if (metaMap[ref]) continue;
        const parsed = chroniclesNftRefToCollectionAndId(ref);
        if (!parsed) continue;
        try {
          const meta = await fetchNFTMetadata(parsed.collection, parsed.tokenId);
          if (!cancelled && meta) next[ref] = meta;
        } catch {
          // ignore
        }
      }
      if (!cancelled && Object.keys(next).length) setMetaMap((prev) => ({ ...prev, ...next }));
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [allPlacementRefs]);

  const getImageUrlForRef = (ref: string): string | null => {
    const meta = metaMap[ref] ?? null;
    const raw = meta?.image ? String(meta.image) : '';
    if (!raw) return null;
    if (raw.startsWith('ipfs://')) return getBestGatewayUrl(raw.replace('ipfs://', ''));
    return raw;
  };

  async function payAndVerify(text: string, amountKas: number, kind: 'slot:activate' | 'slot:set' | 'slot:clear') {
    if (!state.isConnected || !state.provider || !payerKaspa) throw new Error('Connect KasWare to continue.');

    const send = async (kas: number) => {
      const txRes = await sendKaspaTransaction(state.provider as KaspaWalletProvider, {
        to: treasury,
        amount: String(kasToSompi(kas)),
        payload: chroniclesLbPayloadHexFromText(text),
      });
      if (txRes.status === 'failed' || !txRes.txHash) throw new Error(txRes.error ?? 'Transaction was rejected or failed');
      const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
      recordLocalPendingTx(payerKaspa, hash, kind);
      const vr = await verifyLoop(hash, payerKaspa);
      if (!vr.ok) throw new Error(vr.error);
      return { txHash: vr.txHash, txTimeMs: vr.txTimeMs, paidKas: kas };
    };

    const candidates = retryKasCandidates(amountKas, highMassMode);
    for (let i = 0; i < candidates.length; i++) {
      const kas = candidates[i];
      try {
        if (i > 0) {
          setNote(`Wallet UTXO mass too high; retrying with ${kas} KAS to reduce input count${highMassMode ? ' (high-mass mode)' : ''}…`);
        }
        return await send(kas);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e ?? '');
        if (!isStorageMassErrorMessage(msg)) throw e;
      }
    }
    throw new Error(
      "Transaction cannot fit Kaspa mass limits with your current UTXO set. Try wallet maintenance: 1) Compound repeatedly until UTXO count drops, 2) send 20-50 KAS to yourself once or twice, 3) retry in 1-2 minutes."
    );
  }

  async function activate(slotIndex: 2 | 3) {
    setError(null);
    setNote(null);
    setBusy(slotIndex === 2 ? 'activate2' : 'activate3');
    try {
      const text = buildChroniclesLbActivateSlotText({ entityType, entityId, slotIndex, payerKaspa });
      const v = await payAndVerify(text, activationPriceKas, 'slot:activate');
      recordLocalActivate(payerKaspa, entityType, entityId, slotIndex, { txHash: v.txHash, txTimeMs: v.txTimeMs });
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
      const v = await payAndVerify(text, slotChangePriceKas, 'slot:set');
      const parsed = chroniclesNftRefToCollectionAndId(nftRef);
      const rarity =
        parsed && (parsed.collection === 'KREXPRIME' || parsed.collection === 'PIXELKREX')
          ? pointsForNftInSlot({ collection: parsed.collection, tokenId: parsed.tokenId }).rarity
          : 'standard';
      recordLocalSetSlot(payerKaspa, entityType, entityId, slotIndex, nftRef, { txHash: v.txHash, txTimeMs: v.txTimeMs, rarity });
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
      const v = await payAndVerify(text, slotChangePriceKas, 'slot:clear');
      recordLocalSetSlot(payerKaspa, entityType, entityId, slotIndex, null, { txHash: v.txHash, txTimeMs: v.txTimeMs });
      setNote(`Slot ${slotIndex} cleared.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-4 chronicles-vault-card">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">{title}</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Slot 1 is free. Slots 2-3 base cost is {CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS to activate, and setting or clearing a
            slot is {CHRONICLES_LB_SLOT_CHANGE_KAS} KAS base.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#02abb8]/30 bg-[#02abb8]/10 px-3 py-1.5 text-sm">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">your holder pricing ({tier})</span>
            <span className="text-[#02abb8] font-bold">activate {activationPriceKas} KAS, set/clear {slotChangePriceKas} KAS</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Slot rewards</p>
            <a href="/chronicles/leaderboard#points-table" className="text-sm font-bold text-[#02abb8] hover:underline">
              See points →
            </a>
          </div>
        </div>
        <div className="w-full lg:w-auto lg:min-w-[220px]">
          <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 px-4 py-3">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  highMassMode ? 'bg-[#02abb8]' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                aria-hidden
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    highMassMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
              <input
                type="checkbox"
                checked={highMassMode}
                className="sr-only"
                onChange={(e) => {
                  const next = e.target.checked;
                  setHighMassMode(next);
                  writeHighMassMode(next);
                }}
              />
              <Tooltip
                content={
                  "Use this when wallet shows 'Storage mass exceeds maximum'. It retries with larger KAS amounts to help wallet select fewer inputs. If needed, compound in KasWare: wallet > UTXO tab > Compound."
                }
                side="top"
                align="end"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 text-[10px] font-black text-zinc-500">
                  i
                </span>
              </Tooltip>
            </label>
            <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">High-mass mode</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {([1, 2, 3] as const).map((slotIndex) => {
          const isActive = activeSlots.has(slotIndex);
          const value = placement(slotIndex);
          const isThisBusy = busy === slotIndex;
          const parsed = value ? chroniclesNftRefToCollectionAndId(value) : null;
          const collectionName = parsed?.collection ?? (value ? value.split('#')[0] : null);
          const scoring =
            parsed && collectionName ? pointsForNftInSlot({ collection: collectionName, tokenId: parsed.tokenId }) : { points: 0, rarity: 'standard' as const, type: 'standard' as const };
          const imageUrl = value ? getImageUrlForRef(value) : null;
          return (
            <div key={slotIndex} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Slot {slotIndex}</p>
                <span
                  className={`text-[11px] font-black uppercase px-2 py-1 rounded-lg border ${
                    isActive
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-zinc-300/60 dark:border-zinc-700 bg-zinc-200/40 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {isActive ? 'Active' : 'Locked'}
                </span>
              </div>

              <EmptyVeinSlotFrame
                onClick={() => {
                  if (!isActive) return;
                  setSelectedSlotIndex(slotIndex);
                }}
                disabled={!isActive}
                frameClassName="aspect-square"
                className="!bg-white/80 dark:!bg-zinc-950/30"
              >
                {!value ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <EmptyVeinSlotPlusIcon />
                    <div>
                      <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-base">Insert NFT</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        {isActive ? (nftsLoading ? 'Loading NFTs…' : 'Click to select') : 'Activate to unlock'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full flex flex-col items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-2 ring-emerald-500/30 flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={collectionName ?? value} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🧩</div>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-2 truncate max-w-[14rem]">
                      {collectionName}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {scoring.rarity !== 'standard' ? `${scoring.rarity.toUpperCase()} · ` : ''}
                      {scoring.points} pts
                    </p>
                  </div>
                )}
              </EmptyVeinSlotFrame>

              {slotIndex !== 1 && !isActive ? (
                <button
                  type="button"
                  onClick={() => void activate(slotIndex)}
                  disabled={!state.isConnected || busy != null}
                  className="k-control-btn w-full h-11 text-xs font-bold uppercase tracking-wider"
                >
                  {busy === (slotIndex === 2 ? 'activate2' : 'activate3') ? 'Activating…' : `Activate (${activationPriceKas} KAS)`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {note ? <p className="text-sm text-amber-700 dark:text-amber-400">{note}</p> : null}

      {selectedSlotIndex !== null && (
        <ChroniclesNftSlotSelector
          isOpen={true}
          title={`Slot ${selectedSlotIndex}`}
          description={`Inserting or removing an NFT costs ${slotChangePriceKas} KAS.`}
          currentValue={placement(selectedSlotIndex)}
          inUseRefs={allPlacementRefs}
          usageByRef={usageByRef}
          currentContext={selectedSlotIndex !== null ? { entityType, entityId, slotIndex: selectedSlotIndex } : undefined}
          onClose={() => setSelectedSlotIndex(null)}
          onSelect={(ref) => {
            void setSlot(selectedSlotIndex, ref);
          }}
          onRemove={
            placement(selectedSlotIndex)
              ? () => {
                  void clearSlot(selectedSlotIndex);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

