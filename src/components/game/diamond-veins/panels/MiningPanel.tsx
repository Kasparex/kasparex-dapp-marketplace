'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActiveBoost, MiningSlotType, TyconGameState, YieldStats, DiamondVeinsConsumableId } from '@/lib/game/engine';
import { resolveSlotSessionBreakdown } from '@/lib/game/engine/compute-yield';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { nftCrewRoleLabel, MINECORE_NFT_CREW_ROLES_ORDER } from '@/lib/game/minecore/asset-usage';
import {
  DIAMOND_VEINS_CONSUMABLES,
  DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS,
  DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL,
  IDLE_ENERGY_BASE_MS,
  IDLE_SESSION_BONUS_PCT,
} from '@/lib/game/diamond-veins-config';
import * as Icons from 'lucide-react';
import {
  KasparexNftSlotSelector,
  kasparexNftRefToCollectionAndId,
} from '@/components/nft/KasparexNftSlotSelector';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { nftRefKey } from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { AddNftSlotModal } from '@/components/game/AddNftSlotModal';
import { nftCrewRoleBadgeClass } from '@/lib/game/nft-crew-role-styles';
import { KxBadge } from '@/components/ui/KxBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDurationShort(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

const STAT_BADGE_COMPACT =
  'inline-flex max-h-[14px] items-center !py-0 !px-1.5 !text-[9px] !leading-none !rounded-full normal-case tracking-normal tabular-nums';

function statusBadge(status: string) {
  switch (status) {
    case 'mining':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'exhausted':
      return 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/40';
    case 'empty':
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/30';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/30';
  }
}

function energyBarFillCls(pct: number, status: string): string {
  if (status === 'exhausted' || pct <= 0) return 'bg-rose-600';
  if (pct <= 25) return 'bg-red-500';
  if (pct <= 50) return 'bg-orange-500';
  if (pct <= 75) return 'bg-lime-400 dark:bg-lime-500';
  return 'bg-emerald-500';
}

function statusTooltip(status: string): { title: string; description: string } {
  switch (status) {
    case 'mining':
      return {
        title: 'Mining',
        description:
          'This NFT still has energy and is producing Diamonds. Use Feed or Quick feed anytime to top up energy without stopping the run.',
      };
    case 'exhausted':
      return {
        title: 'Exhausted',
        description:
          'Energy is empty, so mining paused. Buy Field Rations, Energy Drinks, or Repair Kits in the Shop, then Restore or Quick feed this worker.',
      };
    case 'empty':
      return {
        title: 'Empty slot',
        description: 'Deploy a Kasparex NFT into this slot to start idle mining.',
      };
    default:
      return { title: status, description: 'Worker slot status.' };
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
  slotPurchaseKasByType,
  miningAllowed,
  consumables,
  onFeedWorker,
  activeBoosts = [],
  krexTier = 'Tier0',
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  diamonds: number;
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
  onPurchaseExtraSlot: (slotTypes: MiningSlotType[]) => void | Promise<boolean>;
  slotPurchaseKasByType: Record<MiningSlotType, number>;
  miningAllowed?: boolean;
  consumables: TyconGameState['consumables'];
  onFeedWorker: (slotIndex: number, itemId: DiamondVeinsConsumableId) => boolean;
  activeBoosts?: ActiveBoost[];
  krexTier?: string;
}) {
  const { state: wallet } = useKaspaWallet();
  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa: wallet.address?.trim(),
    tyconSlots: tycon.slots,
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
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

  const slotTypeOptions = useMemo(
    () =>
      MINECORE_NFT_CREW_ROLES_ORDER.map((t) => ({
        value: t,
        label: nftCrewRoleLabel(t),
        badge: `${DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL[t]} · ${DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS[t]} KAS`,
      })),
    [],
  );

  const buyFromKas = slotPurchaseKasByType.worker;

  return (
      <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="kx-metadata-stat-card rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Flow rate
            <GameTooltip
              title="Flow rate"
              description="Total Diamonds per minute from all NFT workers that still have energy."
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
            {stats.yieldPerSecond > 0
              ? `${(stats.yieldPerSecond * 60).toFixed(2)} D/min`
              : '0.00 D/min'}
          </p>
        </div>
        <div className="kx-metadata-stat-card rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-white/[0.06]">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Diamonds in bag
          </div>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-blue-500 dark:text-blue-400">
            <DiamondIcon className="h-5 w-5" />
            {Math.floor(diamonds).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Refine from the Game Deck above to credit Hub points on /rewards.
          </p>
        </div>
        <div className="kx-metadata-stat-card rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-white/[0.06]">
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
            onClick={() => {
              if (!miningAllowed) return;
              setBuyOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-800 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-200"
          >
            <Icons.Plus className="h-4 w-4" />
            Buy slots · from {buyFromKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
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
            const resolvedTier = tier ?? 'regular';
            const sessionBreakdown = resolveSlotSessionBreakdown(slot.type, resolvedTier, {
              collection: slot.collection,
              activeBoosts,
              nowMs: Date.now(),
            });
            const energyMax =
              info?.energyMax && info.energyMax > 0
                ? info.energyMax
                : sessionBreakdown.energyMax;
            const energy = Math.min(info?.energy ?? slot.energy ?? 0, energyMax);
            const pct = energyMax > 0 ? Math.max(0, Math.min(100, (energy / energyMax) * 100)) : 0;
            const status = info?.status ?? (slot.nftId == null ? 'empty' : energy > 0 ? 'mining' : 'exhausted');
            const feedId = bestConsumable(idx);
            const liveBoosts = activeBoosts.filter((b) => b.endTime > Date.now());
            const shopSessionExtraMs =
              sessionBreakdown.shopMult > 1.0001
                ? Math.max(0, energyMax - Math.floor(sessionBreakdown.baseMs * (1 + sessionBreakdown.nftBonusPct)))
                : 0;

            return (
              <div
                key={idx}
                className="kx-metadata-stat-card overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
                  <div className="mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:w-44">
                    <EmptyVeinSlotFrame
                      onClick={() => setSelected(idx)}
                      frameClassName="aspect-square"
                      className="!p-3"
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center pt-6">
                        <span
                          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${nftCrewRoleBadgeClass(slot.type)}`}
                        >
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
                      <p className="text-lg font-bold tabular-nums">
                        <GameTooltip
                          title="Flow rate"
                          description="Diamonds this worker produces per minute while it still has energy. Higher NFT tiers mine faster."
                        >
                          <span className="cursor-help text-zinc-900 dark:text-zinc-100">Flow Rate: </span>
                        </GameTooltip>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {((info?.yieldPerSecond ?? 0) * 60).toFixed(2)} D/min
                        </span>
                      </p>
                      <GameTooltip {...statusTooltip(status)}>
                        <span
                          className={`cursor-help rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadge(status)}`}
                        >
                          {status}
                        </span>
                      </GameTooltip>
                      {tier && tier !== 'regular' ? (
                        <GameTooltip
                          title={`${tier} tier`}
                          description="Higher NFT tiers last longer and mine faster than regular workers."
                        >
                          <span className="cursor-help rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                            {tier}
                          </span>
                        </GameTooltip>
                      ) : null}
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                      <GameTooltip title="Role" description="Worker, Operator, or Foreman lane for this NFT slot.">
                        <p className="cursor-help">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Role:</span> {roleLabel}
                        </p>
                      </GameTooltip>
                      <GameTooltip title="Collection" description="Kasparex NFT collection assigned to this slot.">
                        <p className="cursor-help">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Collection:</span>{' '}
                          {slot.collection ?? '-'}
                        </p>
                      </GameTooltip>
                      <GameTooltip
                        title="Energy left"
                        description="Remaining mining time after NFT tier, Premium, and active Shop boosts. Feed restores against the full Session max."
                      >
                        <p className="cursor-help">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Energy left:</span>{' '}
                          {formatDuration(energy)}
                        </p>
                      </GameTooltip>
                      <GameTooltip
                        title="Session max"
                        description={`Full session for this ${roleLabel} slot after Diamond/Rarest/Premium and active Shop boosts. Base is ${DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL[slot.type]}.`}
                      >
                        <p className="cursor-help">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Session max:</span>{' '}
                          {formatDuration(energyMax)}
                        </p>
                      </GameTooltip>
                    </div>
                    {meta?.name ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{meta.name}</p>
                    ) : null}
                    {(() => {
                      const traitBoosts: { key: string; label: string; title: string; detail: string; variant: 'emerald' | 'cyan' | 'violet' | 'sky' }[] = [];
                      meta?.traits?.forEach((trait, ti) => {
                        const bonus = getBonusForTrait(String(trait.value));
                        if (!bonus) return;
                        if (bonus.type === 'yield') {
                          traitBoosts.push({
                            key: `trait-yield-${ti}`,
                            label: `+${Math.round(bonus.value * 100)}%`,
                            title: String(trait.value),
                            detail: 'NFT trait yield bonus applied to this worker’s Diamond flow.',
                            variant: 'emerald',
                          });
                        } else if (bonus.type === 'efficiency') {
                          traitBoosts.push({
                            key: `trait-eff-${ti}`,
                            label: `+${Math.round(bonus.value * 100)}%`,
                            title: String(trait.value),
                            detail: 'NFT trait efficiency bonus applied to this worker’s Diamond flow.',
                            variant: 'cyan',
                          });
                        } else if (bonus.type === 'speed') {
                          traitBoosts.push({
                            key: `trait-spd-${ti}`,
                            label: `+${Math.round(bonus.value * 0.25 * 100)}%`,
                            title: String(trait.value),
                            detail: 'NFT trait speed bonus applied to this worker’s Diamond flow.',
                            variant: 'sky',
                          });
                        }
                      });
                      const showBoosts =
                        liveBoosts.length > 0 ||
                        traitBoosts.length > 0 ||
                        sessionBreakdown.diamondPct > 0 ||
                        sessionBreakdown.rarestPct > 0 ||
                        sessionBreakdown.premiumPct > 0 ||
                        shopSessionExtraMs > 0;
                      if (!showBoosts) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1">
                          {sessionBreakdown.diamondPct > 0 ? (
                            <Tooltip
                              content={gameTooltipRich(
                                'Diamond NFT',
                                `+${Math.round(IDLE_SESSION_BONUS_PCT.diamond * 100)}% session max on role base (${formatDuration(IDLE_ENERGY_BASE_MS[slot.type])}).`,
                              )}
                            >
                              <span className="cursor-help">
                                <KxBadge variant="sky" className={STAT_BADGE_COMPACT}>
                                  +{Math.round(sessionBreakdown.diamondPct * 100)}%
                                </KxBadge>
                              </span>
                            </Tooltip>
                          ) : null}
                          {sessionBreakdown.rarestPct > 0 ? (
                            <Tooltip
                              content={gameTooltipRich(
                                'Rarest NFT',
                                `+${Math.round(IDLE_SESSION_BONUS_PCT.rarest * 100)}% session max on role base (${formatDuration(IDLE_ENERGY_BASE_MS[slot.type])}).`,
                              )}
                            >
                              <span className="cursor-help">
                                <KxBadge variant="violet" className={STAT_BADGE_COMPACT}>
                                  +{Math.round(sessionBreakdown.rarestPct * 100)}%
                                </KxBadge>
                              </span>
                            </Tooltip>
                          ) : null}
                          {sessionBreakdown.premiumPct > 0 ? (
                            <Tooltip
                              content={gameTooltipRich(
                                'KREX Premium',
                                `+${Math.round(IDLE_SESSION_BONUS_PCT.premiumCollection * 100)}% session max for KREXPRIME / PIXELKREX NFTs.`,
                              )}
                            >
                              <span className="cursor-help">
                                <KxBadge variant="cyan" className={STAT_BADGE_COMPACT}>
                                  +{Math.round(sessionBreakdown.premiumPct * 100)}%
                                </KxBadge>
                              </span>
                            </Tooltip>
                          ) : null}
                          {shopSessionExtraMs > 0 ? (
                            <Tooltip
                              content={gameTooltipRich(
                                'Shop session boost',
                                `Active Shop boosts extend session max by +${formatDuration(shopSessionExtraMs)} (×${sessionBreakdown.shopMult.toFixed(2)}).`,
                              )}
                            >
                              <span className="cursor-help">
                                <KxBadge variant="amber" className={STAT_BADGE_COMPACT}>
                                  +{formatDurationShort(shopSessionExtraMs)}
                                </KxBadge>
                              </span>
                            </Tooltip>
                          ) : null}
                          {traitBoosts.map((t) => (
                            <Tooltip key={t.key} content={gameTooltipRich(t.title, t.detail)}>
                              <span className="cursor-help">
                                <KxBadge variant={t.variant} className={STAT_BADGE_COMPACT}>
                                  {t.label}
                                </KxBadge>
                              </span>
                            </Tooltip>
                          ))}
                          {liveBoosts.map((b) => {
                            const pctBoost = Math.round((b.multiplier ?? 0) * 100);
                            const label = pctBoost > 0 ? `+${pctBoost}%` : 'BOOST';
                            return (
                              <Tooltip
                                key={b.id}
                                content={gameTooltipRich(
                                  b.name ?? b.type,
                                  `Active Shop ${b.type} boost${pctBoost > 0 ? ` (+${pctBoost}%)` : ''}. Extends session max and multiplies Diamond flow while the timer runs.`,
                                )}
                              >
                                <span className="cursor-help">
                                  <KxBadge
                                    variant={b.type === 'yield' ? 'emerald' : b.type === 'luck' ? 'amber' : 'violet'}
                                    className={STAT_BADGE_COMPACT}
                                  >
                                    {label}
                                  </KxBadge>
                                </span>
                              </Tooltip>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      <GameTooltip
                        title="Mining time remaining"
                        description="Energy bar for this worker. Green is healthy; orange and red mean feed soon from the Shop."
                      >
                        <span className="cursor-help">Mining time remaining</span>
                      </GameTooltip>
                      <span className="tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${energyBarFillCls(pct, status)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <GameTooltip
                    title={status === 'exhausted' ? 'Restore' : 'Feed'}
                    description="Open the consumables picker. Buy supplies in the Shop if your inventory is empty."
                  >
                    <button
                      type="button"
                      disabled={slot.nftId == null}
                      onClick={() => setFeedOpen(idx)}
                      className="k-cta-games h-9 shrink-0 rounded-xl px-4 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {status === 'exhausted' ? 'Restore' : 'Feed'}
                    </button>
                  </GameTooltip>
                  {feedId && slot.nftId != null ? (
                    <GameTooltip
                      title="Quick feed"
                      description="Instantly use your best owned supply (Repair Kit, Energy Drink, or Field Ration) on this worker, including while mining."
                    >
                      <button
                        type="button"
                        onClick={() => onFeedWorker(idx, feedId)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200"
                      >
                        Quick feed
                      </button>
                    </GameTooltip>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddNftSlotModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        options={slotTypeOptions}
        priceByType={slotPurchaseKasByType}
        miningAllowed={miningAllowed}
        onPurchase={onPurchaseExtraSlot}
        description={`Select one or more roles. Worker ${DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL.worker} (${DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.worker} KAS), Operator ${DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL.operator} (${DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.operator} KAS), Foreman ${DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL.foreman} (${DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.foreman} KAS). KREX tier discount applies at checkout.`}
      />

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
