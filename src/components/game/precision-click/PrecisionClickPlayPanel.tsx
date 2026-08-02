'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { GameNftCrewSlotCard } from '@/components/game/GameNftCrewSlotCard';
import { AddNftSlotModal } from '@/components/game/AddNftSlotModal';
import {
  KasparexNftSlotSelector,
  kasparexNftRefToCollectionAndId,
} from '@/components/nft/KasparexNftSlotSelector';
import { KxBadge } from '@/components/ui/KxBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import type { MiningSlotType } from '@/lib/game/engine/types';
import {
  ARIA_TARGETS,
  PRECISION_CLICK_RUN_MS,
  PRECISION_LEVELS,
  PRECISION_OPERATIVE_PERKS,
  fragmentsForClick,
  getAriaTarget,
  getPrecisionLevel,
  pickAriaTargetKind,
  type AriaTargetKind,
  type PrecisionLevelDef,
  type PrecisionOperativeTier,
} from '@/lib/game/precision-click/config';
import type { PrecisionOperativeSlot } from '@/lib/game/precision-click/types';

type LiveTarget = {
  id: string;
  kind: AriaTargetKind;
  x: number;
  y: number;
  r: number;
  ttlMs: number;
  createdAt: number;
};

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

async function resolveNftImageUrl(collection: string, tokenId: number): Promise<string | null> {
  try {
    const meta = await fetchNFTMetadata(collection, tokenId);
    const raw = meta?.image?.trim();
    if (!raw) return null;
    return getBestGatewayUrl(raw.replace(/^ipfs:\/\//i, ''));
  } catch {
    return null;
  }
}

export function PrecisionClickPlayPanel(props: {
  entryUnlocked: boolean;
  runActive: boolean;
  runMsLeft: number;
  maxUnlockedLevel: number;
  highestClearedLevel: number;
  clearedLevels: number[];
  boosterMult: number;
  tierNftMult: number;
  addonBundle: { extraTimeMs: number; fragmentBonusMult: number; missForgiveness: number };
  inventory: { shard_lens: number; null_filter: number };
  operativeSlots: Array<PrecisionOperativeSlot | null>;
  slotUnlockKas: number;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onConsumeItems: (opts: { useShardLens: boolean; useNullFilter: boolean }) => void;
  onClearLevel: (levelId: number, payoutMult: number) => { ok: boolean; banked: number };
  onSetOperative: (
    slotIndex: number,
    slot: {
      nftRef: string;
      collection: string;
      tokenId: number;
      tier?: PrecisionOperativeTier;
      imageUrl?: string | null;
    },
  ) => void;
  onClearOperative: (slotIndex: number) => void;
  onPurchaseOperativeSlots: (slotTypes: MiningSlotType[]) => Promise<boolean>;
  onRunningChange?: (running: boolean) => void;
}) {
  const { state: wallet } = useKaspaWallet();
  const payerKaspa = wallet.address?.trim();
  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa,
    precisionOperative: props.operativeSlots,
  });

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState<LiveTarget[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [sessionFragments, setSessionFragments] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [useShardLens, setUseShardLens] = useState(false);
  const [useNullFilter, setUseNullFilter] = useState(false);
  const [runLens, setRunLens] = useState(false);
  const [runFilter, setRunFilter] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [nftPickerIndex, setNftPickerIndex] = useState<number | null>(null);
  const [buySlotOpen, setBuySlotOpen] = useState(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef(0);
  const missesRef = useRef(0);
  const runningRef = useRef(false);
  const finishedRef = useRef(false);

  const level = getPrecisionLevel(selectedLevel) ?? PRECISION_LEVELS[0]!;
  const cleared = props.clearedLevels.includes(selectedLevel);
  const unlocked = props.runActive && selectedLevel <= props.maxUnlockedLevel && !cleared;
  const totalMult = props.boosterMult * props.tierNftMult * props.addonBundle.fragmentBonusMult;
  const maxMisses = level.maxMisses + props.addonBundle.missForgiveness;
  const durationMs = level.durationMs + props.addonBundle.extraTimeMs;
  const lockPct = Math.max(0, Math.min(100, (props.runMsLeft / PRECISION_CLICK_RUN_MS) * 100));

  const onRunningChange = props.onRunningChange;
  const onClearLevel = props.onClearLevel;
  const onSetOperative = props.onSetOperative;

  useEffect(() => {
    runningRef.current = running;
    onRunningChange?.(running);
  }, [running, onRunningChange]);

  useEffect(() => {
    if (!props.runActive) {
      setSelectedLevel(1);
      return;
    }
    if (selectedLevel > props.maxUnlockedLevel) {
      setSelectedLevel(Math.max(1, props.maxUnlockedLevel));
    }
  }, [props.maxUnlockedLevel, props.runActive, selectedLevel]);

  // Backfill missing NFT artwork for slotted operatives.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (let i = 0; i < props.operativeSlots.length; i++) {
        const slot = props.operativeSlots[i];
        if (!slot?.nftRef || slot.imageUrl) continue;
        const url = await resolveNftImageUrl(slot.collection, slot.tokenId);
        if (cancelled || !url) continue;
        onSetOperative(i, {
          nftRef: slot.nftRef,
          collection: slot.collection,
          tokenId: slot.tokenId,
          tier: slot.tier,
          imageUrl: url,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.operativeSlots, onSetOperative]);

  const finishLevel = useCallback(
    (reason: 'time' | 'misses' | 'cleared') => {
      if (!runningRef.current || finishedRef.current) return;
      finishedRef.current = true;
      runningRef.current = false;
      setRunning(false);
      const progress = Math.max(0, Math.floor(sessionRef.current));
      const didClear = progress >= level.clearGoal || reason === 'cleared';
      if (didClear) {
        const res = onClearLevel(level.id, totalMult);
        setEndReason(
          res.ok
            ? `Level ${level.id} locked clear. +${res.banked.toLocaleString()} Aria fragments banked.`
            : `Level ${level.id} was already cleared this lock.`,
        );
      } else if (reason === 'misses') {
        setEndReason('Too many misses. No fragments banked. Cleared levels stay locked.');
      } else {
        setEndReason(
          `Level failed. Need ${level.clearGoal} progress (got ${progress}). No fragments banked.`,
        );
      }
    },
    [level.clearGoal, level.id, onClearLevel, totalMult],
  );

  function spawnTarget(levelDef: PrecisionLevelDef, lensActive: boolean) {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 20;
    const w = Math.max(200, rect.width);
    const h = Math.max(240, rect.height);
    const kind = pickAriaTargetKind(levelDef.hazardScale);
    const def = getAriaTarget(kind)!;
    let r = def.radiusMin + Math.floor(Math.random() * Math.max(1, def.radiusMax - def.radiusMin));
    if (lensActive && !def.hazard) r += 1;
    const x = pad + r + Math.random() * (w - (pad + r) * 2);
    const y = pad + r + Math.random() * (h - (pad + r) * 2);
    const ttlMs =
      levelDef.ttlMinMs + Math.floor(Math.random() * Math.max(1, levelDef.ttlMaxMs - levelDef.ttlMinMs));
    const createdAt = Date.now();
    const id = `${createdAt}_${Math.random().toString(16).slice(2)}`;
    setTargets((t) => [...t, { id, kind, x, y, r, ttlMs, createdAt }]);
  }

  useEffect(() => {
    if (!running) return;
    sessionRef.current = 0;
    missesRef.current = 0;
    finishedRef.current = false;
    setTargets([]);
    setHits(0);
    setMisses(0);
    setSessionFragments(0);
    setTimeLeftMs(durationMs);
    setEndReason(null);

    const levelDef = level;
    const lens = runLens;

    const tick = setInterval(() => {
      setTimeLeftMs((ms) => Math.max(0, ms - 100));
      setTargets((t) => {
        const now = Date.now();
        const alive: LiveTarget[] = [];
        let expired = 0;
        for (const a of t) {
          if (now - a.createdAt > a.ttlMs) expired++;
          else alive.push(a);
        }
        if (expired > 0) {
          missesRef.current += expired;
          setMisses(missesRef.current);
        }
        return alive;
      });
    }, 100);

    const spawner = setInterval(() => {
      spawnTarget(levelDef, lens);
      if (Math.random() < levelDef.doubleSpawnChance) spawnTarget(levelDef, lens);
    }, levelDef.spawnEveryMs);

    return () => {
      clearInterval(tick);
      clearInterval(spawner);
    };
  }, [running, level, durationMs, runLens]);

  useEffect(() => {
    if (!running) return;
    if (timeLeftMs <= 0) {
      finishLevel('time');
      return;
    }
    if (missesRef.current > maxMisses) {
      finishLevel('misses');
    }
  }, [timeLeftMs, misses, running, maxMisses, finishLevel]);

  function startLevel() {
    if (!unlocked || running || !props.runActive) return;
    const lens = useShardLens && props.inventory.shard_lens > 0;
    const filter = useNullFilter && props.inventory.null_filter > 0;
    setRunLens(lens);
    setRunFilter(filter);
    if (lens || filter) props.onConsumeItems({ useShardLens: lens, useNullFilter: filter });
    setRunning(true);
  }

  const lore = useMemo(() => {
    const lines = [
      'A Null Gang glyph flickers on the wall…',
      'Krex’s visor highlights a weak signal trace.',
      'ARIA’s fragment pulses. Lock it precisely.',
      'Vector’s calibration drifts. Click with intent.',
      'Tessa marks a stealth window. No wasted motion.',
    ];
    return lines[(selectedLevel - 1) % lines.length]!;
  }, [selectedLevel]);

  const pickerSlot = nftPickerIndex != null ? props.operativeSlots[nftPickerIndex] ?? null : null;
  const slotPriceByType = useMemo(
    () =>
      ({
        worker: props.getKasPriceAfterDiscount(props.slotUnlockKas),
        operator: props.getKasPriceAfterDiscount(props.slotUnlockKas),
        foreman: props.getKasPriceAfterDiscount(props.slotUnlockKas),
      }) as Record<MiningSlotType, number>,
    [props.getKasPriceAfterDiscount, props.slotUnlockKas],
  );

  return (
    <div className="space-y-6">
      <Tooltip
        content={gameTooltipRich(
          'Lock window',
          'Your paid ARIA Lock timer. Chrono Seals and Sync Operative NFTs extend it without resetting cleared levels.',
        )}
      >
        <div>
          <GamePanelCard title="Lock window" hint="Finish the cascade before expiry.">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time remaining</p>
                  <p className="text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                    {props.runActive ? formatDuration(props.runMsLeft) : 'Locked'}
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Base 24h · extend via Chrono Seals or Sync Operative NFTs
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[color:var(--hub-accent)] transition-[width] duration-500"
                  style={{ width: `${props.runActive ? lockPct : 0}%` }}
                />
              </div>
            </div>
          </GamePanelCard>
        </div>
      </Tooltip>

      <Tooltip
        content={gameTooltipRich(
          'Level select',
          'Cleared levels stay locked until this lock expires or you pay entry again for a fresh run.',
        )}
      >
        <div>
          <GamePanelCard
            title="Level select"
            hint="Cleared levels stay locked until this lock expires or you pay entry again."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PRECISION_LEVELS.map((lv) => {
                const isCleared = props.clearedLevels.includes(lv.id);
                const isUnlocked = props.runActive && lv.id <= props.maxUnlockedLevel && !isCleared;
                const active = lv.id === selectedLevel;
                return (
                  <button
                    key={lv.id}
                    type="button"
                    disabled={(!isUnlocked && !isCleared) || running}
                    onClick={() => setSelectedLevel(lv.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent)]/10'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Lv {lv.id}
                      {isCleared ? ' · Cleared' : !isUnlocked ? ' · Locked' : ''}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{lv.name}</p>
                  </button>
                );
              })}
            </div>
          </GamePanelCard>
        </div>
      </Tooltip>

      {!props.runActive ? (
        <GamePanelCard title="Entry required" hint="Pay from the Calculation breakdown.">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Open a 24h ARIA Lock from the sidebar Calculation breakdown. When the timer ends, cleared levels reset and you
            must pay entry again. Chrono Seals and Sync Operative NFTs extend the window without resetting progress.
          </p>
        </GamePanelCard>
      ) : (
        <div className="space-y-5">
          <GameOverviewTitleBlock
            as="h3"
            kicker="ARIA Lock"
            title={level.name}
            subtitle={`${level.subtitle} ${lore}`}
            compact
          />

          <HubMetadataStatGrid
            stats={[
              {
                label: 'Progress',
                value: sessionFragments.toLocaleString(),
                copyable: false,
                accent: true,
                tooltipTitle: 'Progress',
                tooltipDescription: 'Session clear meter for this level. Fragments bank only when you hit the clear goal.',
                valueNode: (
                  <span className="text-xl font-black tabular-nums text-[color:var(--hub-accent)] sm:text-2xl">
                    {sessionFragments.toLocaleString()}
                  </span>
                ),
              },
              {
                label: 'Clear goal',
                value: level.clearGoal.toLocaleString(),
                copyable: false,
                tooltipTitle: 'Clear goal',
                tooltipDescription: 'Progress needed to bank this level’s Aria fragment reward.',
              },
              {
                label: 'Multiplier',
                value: `×${totalMult.toFixed(2)}`,
                copyable: false,
                tooltipTitle: 'Multiplier',
                tooltipDescription: 'Live clear payout multiplier from boosters, add-ons, and Sync Operative perks.',
              },
              {
                label: 'Time',
                value: `${(timeLeftMs / 1000).toFixed(1)}s`,
                copyable: false,
                tooltipTitle: 'Level time',
                tooltipDescription: 'Seconds left on this arena run (not the 24h lock).',
              },
              {
                label: 'Hits',
                value: String(hits),
                copyable: false,
                tooltipTitle: 'Hits',
                tooltipDescription: 'Successful target clicks this level.',
              },
              {
                label: 'Misses',
                value: `${misses} / ${maxMisses}`,
                copyable: false,
                tooltipTitle: 'Misses',
                tooltipDescription: 'Expired or hazard misses. Too many ends the level with no bank.',
              },
            ]}
          />

          <Tooltip
            content={gameTooltipRich(
              'Target values',
              'Positive targets add progress. Hazards drain it. Shard Lens enlarges positive targets.',
            )}
          >
            <div className={`${KX_SURFACE_NESTED} flex flex-wrap items-center gap-3 rounded-xl p-3`}>
              <p className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">Target values</p>
              {ARIA_TARGETS.filter((t) => !t.hazard).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-bold tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageSrc} alt="" width={20} height={20} className="rounded-md" />
                  +{t.fragmentMult}×
                </span>
              ))}
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">Hazards drain progress</span>
            </div>
          </Tooltip>

          {endReason ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {endReason}
            </p>
          ) : null}

          <div
            ref={arenaRef}
            className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={level.scenerySrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-zinc-950/25" />

            {!running ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  className="k-cta-games h-12 px-6 text-sm"
                  disabled={!unlocked}
                  onClick={startLevel}
                >
                  {cleared ? `Level ${level.id} cleared` : `Start level ${level.id}`}
                </button>
              </div>
            ) : null}

            {targets.map((t) => {
              const def = getAriaTarget(t.kind)!;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={def.label}
                  title={`${def.label} (${def.hazard ? '' : '+'}${def.fragmentMult}×)`}
                  className="absolute overflow-hidden rounded-full border border-white/30 shadow-lg transition-transform hover:scale-105"
                  style={{ left: t.x - t.r, top: t.y - t.r, width: t.r * 2, height: t.r * 2 }}
                  onClick={() => {
                    setTargets((all) => all.filter((x) => x.id !== t.id));
                    setHits((h) => h + 1);
                    const delta = fragmentsForClick({
                      kind: t.kind,
                      levelMult: level.fragmentMult,
                      addonFragmentMult: props.addonBundle.fragmentBonusMult,
                      boosterMult: props.boosterMult * props.tierNftMult,
                      nullFilterActive: runFilter,
                    });
                    setSessionFragments((s) => {
                      const next = Math.max(0, s + delta);
                      sessionRef.current = next;
                      if (next >= level.clearGoal) {
                        queueMicrotask(() => finishLevel('cleared'));
                      }
                      return next;
                    });
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={def.imageSrc} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Tooltip
              content={gameTooltipRich(
                'Shard Lens',
                'Spend one charge to enlarge positive targets on the next level start.',
              )}
            >
              <div
                className={`${KX_SURFACE_NESTED} rounded-xl border border-transparent p-4 transition-colors hover:border-[color:var(--hub-accent)]`}
              >
                <ToggleSwitch
                  checked={useShardLens}
                  onChange={setUseShardLens}
                  disabled={running || props.inventory.shard_lens <= 0}
                  label={`Shard Lens (${props.inventory.shard_lens})`}
                  description="Larger positive targets for the next level."
                />
              </div>
            </Tooltip>
            <Tooltip
              content={gameTooltipRich(
                'Null Filter',
                'Spend one charge to halve hazard drain on the next level start.',
              )}
            >
              <div
                className={`${KX_SURFACE_NESTED} rounded-xl border border-transparent p-4 transition-colors hover:border-[color:var(--hub-accent)]`}
              >
                <ToggleSwitch
                  checked={useNullFilter}
                  onChange={setUseNullFilter}
                  disabled={running || props.inventory.null_filter <= 0}
                  label={`Null Filter (${props.inventory.null_filter})`}
                  description="Halves hazard drain on the next level."
                />
              </div>
            </Tooltip>
          </div>

          <GamePanelCard
            title="Sync Operative"
            hint="First slot free. Buy Slot unlocks extras."
            right={
              <button
                type="button"
                className="k-control-btn h-9 px-3 text-xs font-bold uppercase tracking-wide"
                onClick={() => setBuySlotOpen(true)}
              >
                Buy Slot
              </button>
            }
          >
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Slot a Krex deck NFT as your Sync Operative. Standard adds +6h, Partner +8h with mild perks, Premium
              (Diamond) +12h with stronger fragment and miss bonuses. NFTs already assigned elsewhere stay locked here.
            </p>
            <div className="space-y-4">
              {props.operativeSlots.map((operative, idx) => {
                const operativeLabel = operative
                  ? PRECISION_OPERATIVE_PERKS[operative.tier].label
                  : null;
                return (
                  <Tooltip
                    key={`op-${idx}`}
                    content={gameTooltipRich(
                      'Sync Operative',
                      idx === 0
                        ? 'Free crew slot. Extends your lock and grants clear perks while slotted.'
                        : 'Extra paid Sync Operative slot. Stacks lock extend; best fragment mult applies.',
                    )}
                  >
                    <div>
                      <GameNftCrewSlotCard
                        roleLabel="Sync Operative"
                        roleType="operator"
                        nftId={operative?.tokenId ?? null}
                        imageUrl={operative?.imageUrl}
                        emptyHint="Deploy NFT"
                        onOpenPicker={() => setNftPickerIndex(idx)}
                        onRemove={operative ? () => props.onClearOperative(idx) : undefined}
                      >
                        {operative ? (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                                Lock extend:{' '}
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{(PRECISION_OPERATIVE_PERKS[operative.tier].extendMs / 3600000).toFixed(0)}h
                                </span>
                              </p>
                              <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-300">
                                {operativeLabel}
                              </span>
                              {operative.tier === 'premium' ? (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                                  Premium
                                </span>
                              ) : null}
                            </div>
                            <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                              <p>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Role:</span> Sync
                                Operative
                              </p>
                              <p>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Collection:</span>{' '}
                                {operative.collection}
                              </p>
                              <p>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Fragment mult:</span>{' '}
                                ×{PRECISION_OPERATIVE_PERKS[operative.tier].fragmentMult}
                              </p>
                              <p>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Miss forgiveness:</span>{' '}
                                +{PRECISION_OPERATIVE_PERKS[operative.tier].missForgiveness}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <KxBadge variant="sky" className="!px-2 !py-0.5 text-[10px] font-bold">
                                +{(PRECISION_OPERATIVE_PERKS[operative.tier].extendMs / 3600000).toFixed(0)}h lock
                              </KxBadge>
                              <KxBadge variant="emerald" className="!px-2 !py-0.5 text-[10px] font-bold">
                                ×{PRECISION_OPERATIVE_PERKS[operative.tier].fragmentMult} clear
                              </KxBadge>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{operative.nftRef}</p>
                          </>
                        ) : (
                          <div className="flex h-full min-h-[7rem] flex-col justify-center">
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No operative slotted</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              Deploy a deck NFT to extend the lock window and unlock clear perks.
                            </p>
                          </div>
                        )}
                      </GameNftCrewSlotCard>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </GamePanelCard>
        </div>
      )}

      <AddNftSlotModal
        open={buySlotOpen}
        onClose={() => setBuySlotOpen(false)}
        title="Buy Sync Operative slot"
        description={`Unlock extra Sync Operative slots (${props.slotUnlockKas} KAS each before KREX discount). First slot is free. Each slotted NFT extends the lock and stacks miss forgiveness; the best fragment mult applies.`}
        options={[{ value: 'worker', label: 'Sync Operative', badge: `${props.slotUnlockKas} KAS` }]}
        priceByType={slotPriceByType}
        initialTypes={['worker']}
        onPurchase={props.onPurchaseOperativeSlots}
      />

      <KasparexNftSlotSelector
        isOpen={nftPickerIndex != null}
        title="Choose Sync Operative"
        description="Deploy an NFT to extend your ARIA Lock window and grant operative perks."
        currentValue={pickerSlot?.nftRef ?? null}
        inUseRefs={inUseRefs}
        usageByRef={usageByRef}
        currentContext={{
          entityType: 'precision-click',
          entityId: 'sync-operative',
          slotIndex: nftPickerIndex ?? 0,
        }}
        collectionAllowlist={getMinecoreDeckCollectionAllowlist()}
        footerNotice="Assignments save to Precision Click in this browser. NFTs already assigned elsewhere show as locked here."
        onClose={() => setNftPickerIndex(null)}
        onRemove={() => {
          if (nftPickerIndex != null) props.onClearOperative(nftPickerIndex);
          setNftPickerIndex(null);
        }}
        onSelect={(nftRef) => {
          const idx = nftPickerIndex;
          if (idx == null) return;
          const parsed = kasparexNftRefToCollectionAndId(nftRef);
          if (!parsed) return;
          void (async () => {
            const imageUrl = await resolveNftImageUrl(parsed.collection, parsed.tokenId);
            props.onSetOperative(idx, {
              nftRef,
              collection: parsed.collection,
              tokenId: parsed.tokenId,
              imageUrl,
            });
            setNftPickerIndex(null);
          })();
        }}
      />
    </div>
  );
}
