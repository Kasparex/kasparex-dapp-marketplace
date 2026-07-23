'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MiningSlotType, TyconGameState, YieldStats, DiamondVeinsConsumableId } from '@/lib/game/engine';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { nftCrewRoleLabel, MINECORE_NFT_CREW_ROLES_ORDER } from '@/lib/game/minecore/asset-usage';
import { DIAMOND_VEINS_CONSUMABLES } from '@/lib/game/diamond-veins-config';
import * as Icons from 'lucide-react';
import {
  KasparexNftSlotSelector,
  kasparexNftRefToCollectionAndId,
} from '@/components/nft/KasparexNftSlotSelector';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { nftRefKey } from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { useKaspaWallet } from '@/lib/kaspa/context';

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function statusBadge(status: string) {
  switch (status) {
    case 'mining':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'exhausted':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
    case 'empty':
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/30';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/30';
  }
}

export function MiningPanel({
  tycon,
  stats,
  diamonds,
  slottedMetadata,
  onDeploy,
  onRemove,
  onPurchaseExtraSlot,
  slotPurchaseKas,
  miningAllowed,
  consumables,
  onFeedWorker,
  krexTier = 'Tier0',
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  diamonds: number;
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
  onPurchaseExtraSlot: (slotType: MiningSlotType) => void | Promise<boolean>;
  slotPurchaseKas: number;
  miningAllowed?: boolean;
  consumables: TyconGameState['consumables'];
  onFeedWorker: (slotIndex: number, itemId: DiamondVeinsConsumableId) => boolean;
  krexTier?: string;
}) {
  const { state: wallet } = useKaspaWallet();
  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa: wallet.address?.trim(),
    tyconSlots: tycon.slots,
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyType, setBuyType] = useState<MiningSlotType>('worker');
  const [feedOpen, setFeedOpen] = useState<number | null>(null);

  useEffect(() => {
    if (!buyOpen && feedOpen == null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setBuyOpen(false);
        setFeedOpen(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [buyOpen, feedOpen]);

  const activeWorkers = useMemo(
    () => tycon.slots.filter((s) => s.nftId != null).length,
    [tycon.slots],
  );

  const modalSlot = selected !== null ? (tycon.slots[selected] ?? null) : null;
  const currentRef =
    modalSlot?.nftId != null && modalSlot.collection
      ? nftRefKey(modalSlot.collection, modalSlot.nftId)
      : null;

  const bestConsumable = (slotIndex: number): DiamondVeinsConsumableId | null => {
    const order: DiamondVeinsConsumableId[] = ['repair-kit', 'energy-drink', 'field-ration'];
    for (const id of order) {
      if ((consumables[id] ?? 0) > 0) return id;
    }
    void slotIndex;
    return null;
  };

  return (
      <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Flow rate
            <GameTooltip
              title="Flow rate"
              description="Total Diamonds per second from all NFT workers that still have energy."
            >
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              >
                ?
              </button>
            </GameTooltip>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.yieldPerSecond.toFixed(2)} D/s
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Diamonds in bag
          </div>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-[#02abb8] dark:text-[#5eead4]">
            <DiamondIcon className="h-5 w-5" />
            {Math.floor(diamonds).toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-500">
            Refine from the Game Deck above to credit Hub points on /rewards.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Active workers
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {activeWorkers} / {tycon.slots.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Higher NFT tiers mine faster · KREX {krexTier} fee discount on Shop prices
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Worker slots</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              First Worker slot is free. Buy more slots to raise daily mining capacity. Deploy with the same NFT picker as
              Minecore.
            </p>
          </div>
          <button
            type="button"
            disabled={!miningAllowed}
            onClick={() => miningAllowed && setBuyOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-800 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-200"
          >
            <Icons.Plus className="h-4 w-4" />
            Buy slot · {slotPurchaseKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
          </button>
        </div>

        <div className="space-y-4">
          {tycon.slots.map((slot, idx) => {
            const info = stats.slots[idx];
            const meta = slot.nftId != null ? slottedMetadata[slot.nftId] : null;
            const tier =
              slot.nftId != null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
            const slotImageUrl = meta?.image
              ? getBestGatewayUrl(String(meta.image).replace('ipfs://', ''))
              : null;
            const roleLabel = nftCrewRoleLabel(slot.type);
            const energyMax = info?.energyMax ?? slot.energyMax ?? 0;
            const energy = info?.energy ?? slot.energy ?? 0;
            const pct = energyMax > 0 ? Math.max(0, Math.min(100, (energy / energyMax) * 100)) : 0;
            const status = info?.status ?? (slot.nftId == null ? 'empty' : energy > 0 ? 'mining' : 'exhausted');
            const feedId = bestConsumable(idx);

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
                  <div className="mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:w-44">
                    <EmptyVeinSlotFrame
                      onClick={() => setSelected(idx)}
                      frameClassName="aspect-square"
                      className="!p-3"
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center pt-6">
                        <span className="absolute left-2 top-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                          {roleLabel}
                          {idx === 0 ? ' · Free' : ''}
                        </span>
                        {slot.nftId != null ? (
                          <button
                            type="button"
                            className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/90 bg-white/95 text-zinc-600 shadow-sm hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-900/95"
                            aria-label="Remove NFT"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(idx);
                            }}
                          >
                            <Icons.X className="h-4 w-4" />
                          </button>
                        ) : null}
                        {!slot.nftId ? (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <EmptyVeinSlotPlusIcon />
                            <p className="text-xs text-zinc-500">Deploy NFT</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-200 ring-2 ring-emerald-500/30 dark:bg-zinc-800">
                              {slotImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={slotImageUrl} alt={`#${slot.nftId}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl">💎</div>
                              )}
                            </div>
                            <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              #{slot.nftId}
                            </h3>
                          </div>
                        )}
                      </div>
                    </EmptyVeinSlotFrame>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        Flow Rate: {(info?.yieldPerSecond ?? 0).toFixed(2)} D/s
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadge(status)}`}
                      >
                        {status}
                      </span>
                      {tier && tier !== 'regular' ? (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                          {tier}
                        </span>
                      ) : null}
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Role:</span> {roleLabel}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Collection:</span>{' '}
                        {slot.collection ?? '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Energy left:</span>{' '}
                        {formatDuration(energy)}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Session max:</span>{' '}
                        {formatDuration(energyMax)}
                      </p>
                    </div>
                    {meta?.name ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{meta.name}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      <span>Mining time remaining</span>
                      <span className="tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'exhausted' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={slot.nftId == null || status === 'mining'}
                    onClick={() => setFeedOpen(idx)}
                    className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status === 'exhausted' ? 'Restore' : status === 'mining' ? 'Mining' : 'Feed'}
                  </button>
                  {feedId && status === 'exhausted' ? (
                    <button
                      type="button"
                      onClick={() => onFeedWorker(idx, feedId)}
                      className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200"
                    >
                      Quick feed
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {buyOpen ? (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setBuyOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add NFT mining slot</h3>
              <button
                type="button"
                onClick={() => setBuyOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Slot type
            </label>
            <select
              value={buyType}
              onChange={(e) => setBuyType(e.target.value as MiningSlotType)}
              className="mb-4 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950"
            >
              {MINECORE_NFT_CREW_ROLES_ORDER.map((t) => (
                <option key={t} value={t}>
                  {nftCrewRoleLabel(t)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!miningAllowed}
              onClick={async () => {
                const ok = await onPurchaseExtraSlot(buyType);
                if (ok) setBuyOpen(false);
              }}
              className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Pay {slotPurchaseKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
            </button>
          </div>
        </div>
      ) : null}

      {feedOpen != null ? (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setFeedOpen(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Restore worker</h3>
            <p className="text-sm text-zinc-500">Use a consumable from your inventory (buy more in Shop).</p>
            {DIAMOND_VEINS_CONSUMABLES.map((c) => {
              const count = consumables[c.id] ?? 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={count < 1}
                  onClick={() => {
                    if (onFeedWorker(feedOpen, c.id)) setFeedOpen(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm hover:border-emerald-500/40 disabled:opacity-40 dark:border-zinc-700"
                >
                  <span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{c.desc}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-zinc-500">×{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {selected !== null && modalSlot ? (
        <KasparexNftSlotSelector
          isOpen={true}
          title={`${nftCrewRoleLabel(modalSlot.type)} slot`}
          description="Deploy a Premium or Partner NFT (same shared Kasparex NFT picker as Minecore). Higher tiers mine Diamonds faster and work longer before needing food or repair kits."
          currentValue={currentRef}
          inUseRefs={inUseRefs}
          usageByRef={usageByRef}
          currentContext={{
            entityType: 'tycon',
            entityId: 'mining',
            slotIndex: selected,
          }}
          collectionAllowlist={getMinecoreDeckCollectionAllowlist()}
          footerNotice="Assignments save to Diamond Veins in this browser. NFTs used in Minecore show as locked here."
          onClose={() => setSelected(null)}
          onSelect={(ref) => {
            const p = kasparexNftRefToCollectionAndId(ref);
            if (!p) return;
            onDeploy(selected, p.tokenId, p.collection);
            setSelected(null);
          }}
          onRemove={() => {
            onRemove(selected);
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
