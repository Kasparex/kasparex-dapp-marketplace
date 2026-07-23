'use client';

import type {
  MinecoreState,
  PlantSlotState,
  MinecoreModuleId,
  MinecorePowerNodeId,
  MinecoreBatteryId,
  PlantType,
} from '@/lib/game/minecore';
import {
  computeLiveBatteryChargeMs,
  computePlantDailyCapProgress,
  computePlantReady,
  computeRollingDailyCapWindowRemainingMs,
  getPowerUnitCap,
  computeBatteryRuntimeMs,
  computeLiveBatterySlotChargeMs,
  computeFlowRatePerMin,
  minecorePlantHasForemanInCrew,
  isBatteryPillarDrained,
} from '@/lib/game/minecore/compute';
import {
  computeConsumptionKw,
  computeEffectiveMiningEfficiencyPct,
  computeMaintenanceWearRatio,
  computeMiningEfficiencyPct,
  powerLoadZoneLabel,
  computePlantRollingDailyCapBreakdown,
  computeProductionKw,
  formatMinecorePowerDisplay,
  computePlantMiningSpeedMultiplier,
  type PlantRollingCapBreakdown,
} from '@/lib/game/minecore/plant-economy';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { Tooltip } from '@/components/ui/Tooltip';
import { KxBadge, kxBadgeClassName, type KxBadgeVariant } from '@/components/ui/KxBadge';
import {
  canAssignBatteryToPlantSlot,
  countBatteriesAssigned,
  countMachinesAssigned,
  countMachinesAssignedExcept,
  countPowerNodesAssigned,
  countModuleAssignments,
  countWorkerNftDeckAssignmentsExcept,
  displayAssignedCount,
  inventoryAllowsPlantSetup,
  MINECORE_NFT_CREW_ROLES_ORDER,
  nftDeckRoleLabel,
  nftTabSlotDeployments,
  normalizePlantSetup,
  plantNftSlotAssignmentValid,
  explainPlantSetupBlock,
  nextPlantSetupAfterInstallPart,
  normalizedPlantSetupsEqual,
  type InstallPartPayload,
} from '@/lib/game/minecore/asset-usage';
import {
  describePlantWorkerAssignments,
  sumCrewRollingCapBonusFromAssignments,
} from '@/lib/game/minecore/plant-worker-display';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_POWER_NODES,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_MAX_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_POWER_UNITS,
  MINECORE_PLANT_WORKFORCE_CAPACITY,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_PLANT_TYPE_ORDER,
  MINECORE_KREX_PER_KAS,
  MINECORE_KW_SCALE,
  MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR,
  MINECORE_PLANT_REPAIR_KAS,
  MINECORE_POWER_CRITICAL_LOAD,
  MINECORE_KREX_BOOST_DURATION_MS,
  MINECORE_KREX_BOOST_YIELD_MULT,
  fabricatedOperatorSlotsCapacity,
  miningWorkerNftSlotsRequired,
  type ModuleConfig,
} from '@/lib/game/minecore/config';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import {
  getPlantBatterySlotCount,
  getPlantPowerNodeSlotCount,
  hasInstalledBattery,
  getMaxChargePerSlotMs,
  normalizeBatteryIds,
  ensureBatterySlotChargeLength,
  sumChargeMs,
} from '@/lib/game/minecore/battery-utils';
import { minecoreDeckBenefits } from '@/lib/game/minecore/nft-deck-benefits';
import {
  listKasForBatterySlotRecharge,
  sumListKasForBatterySlotRecharge,
} from '@/lib/game/minecore/recharge-pricing';
import {
  MINECORE_PLANT_UPGRADE_CAP_MILESTONE_FRAC,
  plantTierOrderIndex,
  plantTierUnlockDiamondThreshold,
  tierCapMilestoneRecorded,
  nextPlantTier,
} from '@/lib/game/minecore/plant-upgrade';
import { useState, useEffect, useMemo, useCallback, Children, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(n: number) {
  return n <= 0 ? 0 : n >= 1 ? 1 : n;
}

/** Maintenance bar fill: accent when healthy; purple mid-band; orange/red when worn. */
function maintenanceMeterFillCss(health: number): string {
  const h = clamp01(health);
  const accent = { hue: 158, sat: 64, lig: 52 };
  const purple = { hue: 262, sat: 83, lig: 58 };
  const orange = { hue: 28, sat: 92, lig: 54 };
  const red = { hue: 0, sat: 72, lig: 50 };

  type C = { hue: number; sat: number; lig: number };
  function mix(a: C, b: C, u: number): C {
    return {
      hue: a.hue + (b.hue - a.hue) * u,
      sat: a.sat + (b.sat - a.sat) * u,
      lig: a.lig + (b.lig - a.lig) * u,
    };
  }

  let c: C;
  if (h >= 0.93) {
    c = accent;
  } else if (h >= 0.68) {
    const u = (h - 0.68) / (0.93 - 0.68);
    c = mix(purple, accent, u);
  } else if (h >= 0.38) {
    const u = (h - 0.38) / (0.68 - 0.38);
    c = mix(orange, purple, u);
  } else {
    const u = h <= 0 ? 0 : h / 0.38;
    c = mix(red, orange, u);
  }
  return `hsl(${Math.round(c.hue)} ${Math.round(c.sat)}% ${Math.round(c.lig)}%)`;
}

function togglePowerNodeSlotAssignment(
  ids: readonly (MinecorePowerNodeId | null)[],
  nodeId: MinecorePowerNodeId,
  direction: 'add' | 'remove',
): (MinecorePowerNodeId | null)[] {
  const copy = [...ids];
  if (direction === 'add') {
    const fi = copy.indexOf(null);
    if (fi >= 0) copy[fi] = nodeId;
    return copy;
  }
  for (let i = copy.length - 1; i >= 0; i--) {
    if (copy[i] === nodeId) {
      copy[i] = null;
      break;
    }
  }
  return copy;
}

/** Show auxiliary Recharge CTA only when charge is below this fraction of capacity. */
const BATTERY_LOW_RECHARGE_THRESHOLD = 0.35;

const MINING_ASSIGNABLE_TYPES = ['worker', 'operator', 'foreman'] as const;

function plantStatusVariant(status: PlantSlotState['status']): KxBadgeVariant {
  if (status === 'MiningActive' || status === 'ReadyToMine') return 'emerald';
  if (status === 'MiningPaused' || status === 'SetupIncomplete') return 'amber';
  if (status === 'CreditingReady') return 'sky';
  if (status === 'BatteryEmpty' || status === 'InsufficientPower') return 'orange';
  if (status === 'DailyCapReached') return 'violet';
  if (status === 'NeedsPower' || status === 'NeedsRepair') return 'rose';
  return 'zinc';
}

const STAT_BADGE_COMPACT =
  'inline-flex max-h-[14px] items-center !py-0 !px-1.5 !text-[9px] !leading-none !rounded-full normal-case tracking-normal tabular-nums';

function StatBadge({
  variant,
  children,
  className = '',
}: {
  variant: KxBadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <KxBadge variant={variant} className={`${STAT_BADGE_COMPACT} ${className}`.trim()}>
      {children}
    </KxBadge>
  );
}

function ToggleSwitch(props: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      id={props.id}
      role="switch"
      aria-checked={props.checked}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
      className={`relative h-7 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500/50 disabled:opacity-40 ${
        props.checked ? 'bg-sky-500 dark:bg-sky-600' : 'bg-zinc-300 dark:bg-zinc-600'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200 ${
          props.checked ? 'left-[calc(100%-1.35rem)]' : 'left-1'
        }`}
      />
    </button>
  );
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Label max stored runtime per battery pillar (matches Power tab density). */
function formatShortBatterySlotRuntime(ms: number): string {
  if (ms <= 0) return '-';
  const totalMin = ms / 60_000;
  if (totalMin < 60) return `${Math.max(1, Math.round(totalMin))}m`;
  const h = totalMin / 60;
  if (h >= 10) return `${Math.round(h)}h`;
  const rounded = Math.round(h * 10) / 10;
  return rounded % 1 === 0 ? `${Math.round(rounded)}h` : `${rounded.toFixed(1)}h`;
}

/** HH:MM:SS countdown for 24h window remaining. */
function formatCapResetCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function labelForStatus(status: PlantSlotState['status']) {
  if (status === 'EmptySlot')       return 'Empty slot';
  if (status === 'SetupIncomplete') return 'Setup incomplete';
  if (status === 'ReadyToMine')     return 'Ready';
  if (status === 'MiningActive')    return 'Active';
  if (status === 'MiningPaused')    return 'Paused';
  if (status === 'BatteryEmpty')    return 'Battery empty';
  if (status === 'CreditingReady') return 'Crediting';
  if (status === 'NeedsRepair')     return 'Needs repair';
  if (status === 'NeedsPower')      return 'Needs power';
  if (status === 'InsufficientPower') return 'Grid deficit';
  if (status === 'DailyCapReached') return '24h cap';
  return status;
}

function tooltipForStatus(status: PlantSlotState['status']): ReactNode {
  switch (status) {
    case 'EmptySlot':
      return gameTooltipRich('Empty slot', 'This row has no unlocked plant yet.');
    case 'SetupIncomplete':
      return gameTooltipRich('Setup incomplete', 'Finish machine, batteries, crew, and power as required for this plant.');
    case 'ReadyToMine':
      return gameTooltipRich('Ready', 'Plant is configured; start a mining run when you want.');
    case 'MiningActive':
      return gameTooltipRich('Active', 'Mining is running. Diamonds accrue until you stop, hit the cap, or the battery empties.');
    case 'MiningPaused':
      return gameTooltipRich('Paused', 'Run is paused: no new diamonds and no battery drain until you resume.');
    case 'BatteryEmpty':
      return gameTooltipRich('Battery empty', 'No charge left in the installed pack. Recharge to mine again.');
    case 'CreditingReady':
      return gameTooltipRich('Crediting', 'Cycle finished; accrued diamonds are settling (no further action needed here).');
    case 'NeedsRepair':
      return gameTooltipRich('Needs repair', 'Maintenance exceeded safe wear. Repair before normal mining.');
    case 'NeedsPower':
      return gameTooltipRich('Needs power', 'Grid or stored energy is too low to start a safe run.');
    case 'InsufficientPower':
      return gameTooltipRich(
        'Grid overload',
        'Draw is too high versus this plant’s max power (above the critical load band). Upgrade or add reactors in Setup, trim draw with cooling modules, or swap rigs until load drops.',
      );
    case 'DailyCapReached':
      return gameTooltipRich(
        '24h cap',
        'Rolling extraction budget for this plant is full. Wait for the countdown, raise ceiling (rig / crew / Overclock / KREX Boost), or refine diamonds that are still sitting on this plant into points. That frees headroom. Diamonds already sent to your refineable wallet from Extract still count toward this window until it rolls.',
      );
    default:
      return gameTooltipRich('Plant status', 'Current state for this mining plant.');
  }
}

function SelectionModal(props: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { isOpen, onClose } = props;
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!props.isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={props.onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{props.title}</h3>
          <button onClick={props.onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icons.X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3 custom-scrollbar">
          {props.children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** ✓ / ✗ row for the setup checklist */
function CheckRow(props: {
  installed: boolean;
  label: string;
  value?: string;
  stat?: string;
  statTone?: 'default' | 'rose';
  badges?: ReactNode;
  tooltip: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const statCls =
    props.statTone === 'rose'
      ? 'inline-flex max-h-[14px] items-center flex-shrink-0 rounded-full px-1.5 py-0 text-[9px] font-bold leading-none bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
      : 'inline-flex max-h-[14px] items-center flex-shrink-0 rounded-full px-1.5 py-0 text-[9px] font-bold leading-none text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
  const interactive = Boolean(props.onClick) && !props.disabled;
  const rowCls = `flex w-full items-center gap-2 py-1.5 px-2 rounded-lg transition-colors group text-left font-sans ${
    interactive ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer' : 'cursor-not-allowed opacity-55'
  }`;

  const inner = (
    <>
      <span className={`flex-shrink-0 text-sm font-black ${props.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
        {props.installed ? '✓' : '✗'}
      </span>
      <span className={`text-xs font-semibold max-w-[44%] flex-shrink-0 leading-tight sm:max-w-[40%] ${props.installed ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
        {props.label}
      </span>
      <span className={`text-xs truncate flex-1 font-medium min-w-0 ${props.installed ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600 italic'}`}>
        {props.value ?? 'Tap to assign…'}
      </span>
      {props.badges ? (
        <span className="flex max-w-[42%] flex-shrink-0 flex-wrap items-center justify-end gap-1 sm:max-w-none">{props.badges}</span>
      ) : null}
      {props.stat ? <span className={statCls}>{props.stat}</span> : null}
      {interactive ? (
        <Icons.ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors" />
      ) : null}
    </>
  );

  return (
    <Tooltip content={props.tooltip}>
      {interactive ? (
        <button type="button" className={rowCls} onClick={props.onClick}>
          {inner}
        </button>
      ) : (
        <div className={rowCls} aria-disabled={props.disabled || undefined}>
          {inner}
        </div>
      )}
    </Tooltip>
  );
}

/** Shows at most `max` badge nodes; trailing ellipsis when there are more (Setup capsule row). */
function limitSetupBadges(children: ReactNode, max = 3): ReactNode {
  const arr = Children.toArray(children).filter((c) => c != null && typeof c !== 'boolean');
  if (arr.length === 0) return null;
  if (arr.length <= max) return <>{arr}</>;
  return (
    <>
      {arr.slice(0, max)}
      <span title="Additional bonuses; see row tooltip">
        <KxBadge variant="zinc" className={`${STAT_BADGE_COMPACT} !px-1 !text-[8px]`}>
          …
        </KxBadge>
      </span>
    </>
  );
}

/** Narrow rounded pill marker on progress tracks (dark bar). */
function SectionStyleProgressMarker() {
  return (
    <div
      className="h-[calc(100%+10px)] min-h-[14px] w-1 shrink-0 rounded-full bg-zinc-900 shadow-sm ring-1 ring-black/25 dark:bg-zinc-100 dark:ring-white/30"
      aria-hidden
    />
  );
}

/** Daily cap: rolling 24h from plant activation; visible cap reset timer + progress bar. */
function DailyCapBar(props: {
  mined: number;
  cap: number;
  ratio: number;
  /** When setup incomplete - show 0/0 and empty progress (counters still visible). */
  forceZeroDisplay: boolean;
  /** When false, dim “of” and “/ 24h” like inactive flow (no active mining run). */
  counterMuted: boolean;
  capReached: boolean;
  remainingMs: number;
  capStack?: PlantRollingCapBreakdown;
  /** Diamonds toward rolling cap for next-tier unlock; marker on bar when a higher tier exists. */
  upgradeMilestoneDiamonds?: number | null;
}) {
  const r = clamp01(props.ratio);
  const showCountdown = props.remainingMs > 0;
  const displayMined = props.forceZeroDisplay ? 0 : Math.floor(props.mined);
  const displayCap = props.forceZeroDisplay ? 0 : Math.max(0, Math.floor(props.cap));

  const capStackHint =
    props.capStack != null && !props.forceZeroDisplay
      ? (() => {
          const cs = props.capStack;
          let line = `Cap stack: Plant +${cs.plantBase} · Rig +${cs.machineCap} · Crew +${cs.crewCap}`;
          if (cs.moduleFlat > 0) line += ` · Modules +${cs.moduleFlat}`;
          line += ` = ${cs.subtotal} base /24h`;
          if (cs.kasOverclockFlat > 0) line += ` · Overclock +${cs.kasOverclockFlat}`;
          if (cs.krexYieldMult > 1) line += ` · ×${cs.krexYieldMult} KREX Boost yield on rolling cap`;
          line += ` → effective ceiling ${cs.ceiling} D/24h (matches Emerald total)`;
          if (cs.ceiling === 0 && cs.subtotal > 0) line += '; finish batteries, rig, crew, and power so the rolling cap activates';
          else if (cs.ceiling > 0 && cs.ceiling < cs.floorAfterYieldMult)
            line += ` · capped at tier max ${cs.plantMax}`;
          return line;
        })()
      : '';

  const countdownBlock = showCountdown ? (
    <Tooltip
      content={gameTooltipRich(
        'Cap reset timer',
        'Time left until this plant’s rolling 24h diamond budget window resets.',
      )}
    >
      <span
        className={`font-mono text-lg font-black tabular-nums tracking-tight sm:text-xl ${
          props.forceZeroDisplay ? 'text-zinc-500 dark:text-zinc-500' : 'text-sky-600 dark:text-sky-300'
        }`}
      >
        {formatCapResetCountdown(props.remainingMs)}
      </span>
    </Tooltip>
  ) : null;

  const counterSepCls = props.counterMuted
    ? 'text-zinc-500 dark:text-zinc-500'
    : 'text-zinc-500 dark:text-zinc-400';

  const counterTip =
    props.forceZeroDisplay
      ? gameTooltipRich('Mined / cap', 'Complete setup to see your rolling cap and mined total.')
      : capStackHint
        ? gameTooltipRich('Mined / cap', (
            <>
              <p>Diamonds mined so far this 24h window compared to your effective ceiling.</p>
              <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug opacity-95">{capStackHint}</p>
            </>
          ))
        : gameTooltipRich(
            'Mined / cap',
            'Diamonds mined so far this 24h rolling window versus your budget for that window.',
          );

  const counterBlock = (
    <Tooltip content={counterTip}>
      <span className="inline-flex cursor-help flex-wrap items-baseline justify-end gap-x-0 gap-y-0 text-lg font-black tabular-nums tracking-tight sm:text-xl">
        <DiamondIcon className="mr-0.5 inline-block h-4 w-4 shrink-0 translate-y-px text-sky-400" title="" />
        <span className="text-blue-500 dark:text-blue-400">{displayMined.toLocaleString()}</span>
        <span className={`px-1 text-sm font-bold ${counterSepCls}`}>of</span>
        <span className="text-emerald-600 dark:text-emerald-400">{displayCap.toLocaleString()}</span>
        <span className={`pl-1.5 text-sm font-bold ${counterSepCls}`}>/ 24h</span>
      </span>
    </Tooltip>
  );

  const milestoneDiamonds =
    props.upgradeMilestoneDiamonds != null && props.upgradeMilestoneDiamonds > 0
      ? props.upgradeMilestoneDiamonds
      : null;
  const milestonePct =
    milestoneDiamonds != null && props.cap > 0 && !props.forceZeroDisplay
      ? Math.min(100, Math.max(0, (milestoneDiamonds / props.cap) * 100))
      : null;

  const progressFillPct = props.forceZeroDisplay ? 0 : Math.max(2, Math.round(r * 100));

  const progressBlock = (
    <div className="relative h-2.5 w-full overflow-visible">
      <Tooltip
        content={gameTooltipRich(
          'Cap progress',
          props.forceZeroDisplay
            ? 'Finish setup on this plant to track how much of its 24-hour diamond budget you’ve used in the rolling window.'
            : 'How much of this plant’s 24-hour diamond budget you’ve already used in the current rolling window.',
        )}
      >
        <div
          className={`relative h-2.5 w-full cursor-help overflow-visible rounded-full ${
            props.forceZeroDisplay ? 'bg-zinc-300/85 dark:bg-zinc-700/75' : 'bg-zinc-200 dark:bg-zinc-800'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] overflow-hidden rounded-full"
            style={{ width: `${progressFillPct}%` }}
          >
            <div
              className={`h-full w-full rounded-full transition-[width] duration-700 ${
                props.forceZeroDisplay
                  ? 'bg-zinc-400 dark:bg-zinc-600'
                  : 'bg-blue-500 dark:bg-blue-500'
              }`}
            />
          </div>
        </div>
      </Tooltip>
      {milestonePct != null && milestoneDiamonds != null ? (
        <Tooltip
          content={gameTooltipRich(
            'Next tier milestone',
            <>
              <p>
                One-time goal this window: reach{' '}
                <strong>{milestoneDiamonds.toLocaleString()} diamonds</strong> toward your rolling cap (everything mined here,
                banked on the plant, plus diamonds still accruing in an active run). Nail it once and you can buy the next plant tier.
              </p>
            </>,
          )}
        >
          <div
            className="absolute top-1/2 z-[4] flex min-h-[22px] -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center px-2 py-0.5"
            style={{ left: `${milestonePct}%` }}
          >
            <SectionStyleProgressMarker />
          </div>
        </Tooltip>
      ) : null}
    </div>
  );

  const capReachedBlock =
    !props.forceZeroDisplay && props.capReached ? (
      <Tooltip
        content={gameTooltipRich(
          'Cap reached',
          <>
            <p>
              Rolling extraction budget for this plant is full until the window resets (see countdown on the cap bar) or your ceiling rises from a better rig, crew bonuses, Overclock, or KREX Boost.
            </p>
            <p className="mt-1 opacity-95">
              Refining diamonds still banked on this plant (Redeem) frees extraction headroom. Diamonds you already Extracted to the refineable balance still count until the window resets.
            </p>
          </>,
        )}
      >
        <div className="cursor-help text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          Rolling 24h cap reached. Reset timer, stronger ceiling, or refine on-plant diamonds into points to mine again (wallet diamonds from Extract still count this window).
        </div>
      </Tooltip>
    ) : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <div className="min-w-0 shrink-0">{countdownBlock}</div>
        <div className="min-w-0 flex-1 text-right">{counterBlock}</div>
      </div>
      <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800 space-y-2">
        {progressBlock}
        {capReachedBlock}
      </div>
    </div>
  );
}

/** Same capsule chrome as ModalPartRow, for Remove / secondary actions (no Owned/In use columns). */
function ModalActionRow(props: {
  title: string;
  subtitle: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  const borderCls = props.destructive
    ? 'border-rose-200/90 bg-rose-50/80 hover:border-rose-300 dark:border-rose-500/35 dark:bg-rose-500/10 dark:hover:border-rose-500/50'
    : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600';
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={`mt-2 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${borderCls}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{props.title}</div>
        <div className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{props.subtitle}</div>
      </div>
      <Icons.ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
    </button>
  );
}

/** Power-tab style row for setup modals. */
function ModalPartRow(props: {
  title: string;
  subtitle: string;
  owned: number;
  inUse: number;
  disabled?: boolean;
  /** Shown when disabled - tooltip explains why the row is not clickable. */
  disabledHint?: string;
  selected?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  const borderCls = props.selected
    ? 'border-emerald-500 bg-emerald-500/5 dark:border-emerald-500/60'
    : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600';
  const btn = (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={`flex w-full flex-wrap items-stretch justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${borderCls}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{props.title}</span>
        <span className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{props.subtitle}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
        <div className="flex min-w-[3.25rem] flex-col items-end">
          <span className="text-[10px] font-semibold text-zinc-400">Owned</span>
          <span className="font-mono text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">{props.owned}</span>
        </div>
        <div className="flex min-w-[3.25rem] flex-col items-end">
          <span className="text-[10px] font-semibold text-zinc-400">In use</span>
          <span className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{props.inUse}</span>
        </div>
        {props.trailing ?? <Icons.ChevronRight className="h-5 w-5 shrink-0 self-center text-zinc-300 dark:text-zinc-600" />}
      </div>
    </button>
  );
  if (props.disabled && props.disabledHint) {
    return (
      <Tooltip content={gameTooltipRich('Cannot use this part', props.disabledHint)}>
        <span className="block w-full">{btn}</span>
      </Tooltip>
    );
  }
  return btn;
}

function tierBatteryFillCls(ratio: number): string {
  const r = clamp01(ratio);
  if (r <= 0.01) return 'bg-zinc-300 dark:bg-zinc-600';
  if (r <= 0.25) return 'bg-red-500';
  if (r <= 0.5) return 'bg-orange-500';
  if (r <= 0.75) return 'bg-lime-400 dark:bg-lime-500';
  return 'bg-emerald-500';
}

/** Grid load = consumption ÷ max supply; drives efficiency bands and mining eligibility. */
function PowerGridBalanceBar(props: { prodKw: number; consKw: number; balKw: number }) {
  const rawLoad = props.prodKw > 1e-9 ? props.consKw / props.prodKw : Number.POSITIVE_INFINITY;
  const zone = powerLoadZoneLabel(rawLoad);
  const barPct = Number.isFinite(rawLoad) ? Math.min(100, rawLoad * 100) : 100;
  const zoneLabel = zone === 'optimal' ? 'Optimal' : zone === 'good' ? 'Good' : zone === 'strained' ? 'Strained' : 'Critical';
  const fillCls =
    zone === 'optimal'
      ? 'bg-emerald-500'
      : zone === 'good'
        ? 'bg-lime-500'
        : zone === 'strained'
          ? 'bg-amber-500'
          : 'bg-rose-600';
  const loadPctLabel = Number.isFinite(rawLoad) ? `${Math.min(999, Math.round(rawLoad * 100))}%` : '-';

  const barTip = gameTooltipRich(
    'Power grid load',
    <>
      <p>Load is consumption divided by max plant power. It sets grid efficiency before maintenance wear.</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-3">
        <li>0–25%: optimal performance</li>
        <li>25–50%: good performance</li>
        <li>50–75%: strained. Add or upgrade Power in Setup.</li>
        <li>Above 75%: critical. Mining cannot run until load drops.</li>
      </ul>
    </>,
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-mono text-[10px] text-zinc-700 dark:text-zinc-200">
        <Tooltip
          content={gameTooltipRich(
            'Consumption',
            <>
              <p>
                Draw from your mining rig, every installed battery pack, and active modules on this plant (kW). More gear
                raises load; add reactors or cooling to stay in a safe band.
              </p>
            </>,
          )}
        >
          <span className="cursor-help text-rose-600 dark:text-rose-400">
            Consumption {formatMinecorePowerDisplay(props.consKw)}
          </span>
        </Tooltip>
        <Tooltip
          content={gameTooltipRich(
            'Max power',
            'Supply budget from plant tier, rig bus contribution, and any reactor you installed (kW).',
          )}
        >
          <span className="cursor-help text-emerald-600 dark:text-emerald-400">
            Max power {formatMinecorePowerDisplay(props.prodKw)}
          </span>
        </Tooltip>
      </div>
      <Tooltip content={barTip}>
        <div className="relative h-3 w-full cursor-help overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {[25, 50, 75].map((pct) => (
            <div
              key={pct}
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-zinc-900/20 dark:bg-zinc-100/25"
              style={{ left: `${pct}%` }}
            />
          ))}
          <div
            className={`absolute bottom-0 left-0 top-0 z-[1] ${fillCls} transition-[width] duration-500`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </Tooltip>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] font-semibold">
        <Tooltip
          content={gameTooltipRich(
            'Power balance',
            'Max power minus consumption. Positive means spare headroom; negative means you are over budget on paper.',
          )}
        >
          <span
            className={`cursor-help ${props.balKw >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}
          >
            Balance {props.balKw >= 0 ? '+' : '−'}
            {formatMinecorePowerDisplay(Math.abs(props.balKw))}
          </span>
        </Tooltip>
        <Tooltip content={barTip}>
          <span className="ml-auto shrink-0 cursor-help text-right text-zinc-500 dark:text-zinc-400">
            Load {loadPctLabel} · {zoneLabel}
            {rawLoad > MINECORE_POWER_CRITICAL_LOAD ? ' · above critical band' : ''}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

/** One mini battery silhouette per slot - empty slots inactive; click installs or opens refill modal from parent. */
function UnifiedBatterySegmentsBar(props: {
  liveSlotMs: number[];
  maxSlotMs: number[];
  miningLeftMs: number;
  miningMaxMs: number;
  liveChargeMs: number;
  capacityMs: number;
  onSlotPress: (slotIndex: number, installed: boolean) => void;
  /** Extra paragraphs under Energy · mining runtime (rig multiplier, pillar sum, etc.). */
  energyDetail?: ReactNode;
}) {
  const miningLeftMs = Math.max(0, props.miningLeftMs);
  const miningMaxMs = Math.max(0, props.miningMaxMs);
  const miningFrac = miningMaxMs > 1e-6 ? clamp01(miningLeftMs / miningMaxMs) : 0;
  const hasPackStats = miningMaxMs > 0;

  return (
    <div className="space-y-1.5 rounded-xl border border-zinc-100 bg-white/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
      <Tooltip
        content={gameTooltipRich(
          'Energy · mining runtime',
          <>
            <p>
              Charge left in the active run versus the capacity of your installed pack. Slot pillars below drain in order (1 → 2
              …).
            </p>
            <p className="mt-1">
              To change or remove a battery type on a pillar, drain that pillar&apos;s stored runtime to empty first.
            </p>
            {props.energyDetail ? <div className="mt-1 space-y-1 text-[11px] leading-snug">{props.energyDetail}</div> : null}
          </>,
        )}
      >
        <span className="block cursor-help text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          Energy · mining runtime
        </span>
      </Tooltip>
      {hasPackStats ? (
        <div className="space-y-1">
          <Tooltip
            content={gameTooltipRich(
              'Run charge',
              <>
                <p>How much stored runtime remains for the current mining session versus a full pack.</p>
                <p className="mt-1">
                  Total pack: {props.liveChargeMs > 0 ? formatDuration(props.liveChargeMs) : '0'} /{' '}
                  {formatDuration(props.capacityMs)}
                </p>
              </>,
            )}
          >
            <div className="cursor-help space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums">
                <span className="text-sky-700 dark:text-sky-300">{formatDuration(miningLeftMs)} left</span>
                <span className="font-medium text-zinc-500 dark:text-zinc-400">{formatDuration(miningMaxMs)} max</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-sky-500 transition-[width] duration-500 dark:bg-sky-500"
                  style={{ width: `${Math.round(miningFrac * 100)}%` }}
                />
              </div>
            </div>
          </Tooltip>
        </div>
      ) : null}
      <div className="flex items-end justify-center gap-2 pt-0.5">
        {props.maxSlotMs.map((max, i) => {
          const live = props.liveSlotMs[i] ?? 0;
          const installed = max > 0;
          const r = installed ? live / max : 0;
          const fillCls = tierBatteryFillCls(r);
          const slotRuntimeLabel = installed ? formatShortBatterySlotRuntime(max) : '-';
          return (
            <Tooltip
              key={i}
              content={
                installed
                  ? gameTooltipRich(
                      `Battery pillar ${i + 1}`,
                      <>
                        <p>
                          {formatShortBatterySlotRuntime(live)} left of {formatShortBatterySlotRuntime(max)} stored runtime.
                          Earlier pillars drain first during a run.
                        </p>
                        <p className="mt-1">
                          Drain this pillar to empty before you can change or remove the battery type mounted here.
                        </p>
                      </>,
                    )
                  : gameTooltipRich(
                      `Empty pillar ${i + 1}`,
                      <>
                        <p>Tap to assign a battery pack from inventory.</p>
                        <p className="mt-1">
                          Once a pack is mounted, you must drain stored runtime to empty before swapping or removing that battery
                          type.
                        </p>
                      </>,
                    )
              }
            >
              <button
                type="button"
                onClick={() => props.onSlotPress(i, installed)}
                className="group flex flex-col items-center gap-0.5 rounded-lg p-0.5 outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              >
                <div
                  className={`relative h-16 w-9 overflow-hidden rounded-md border-2 bg-zinc-100/90 dark:bg-zinc-900/90 ${
                    installed
                      ? 'border-zinc-700 dark:border-zinc-400'
                      : 'border-zinc-300 opacity-60 dark:border-zinc-600'
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 mx-auto h-1 w-3 rounded-b-sm ${installed ? 'bg-zinc-700 dark:bg-zinc-400' : 'bg-zinc-400 dark:bg-zinc-600'}`}
                    aria-hidden
                  />
                  {installed ? (
                    <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${fillCls}`} style={{ height: `${clamp01(r) * 100}%` }} />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-0.5">
                    <span className="max-w-full truncate text-center text-[9px] font-black tabular-nums leading-none text-zinc-800 drop-shadow-[0_0_4px_rgba(255,255,255,0.9)] dark:text-zinc-100 dark:drop-shadow-[0_0_4px_rgba(0,0,0,0.85)]">
                      {slotRuntimeLabel}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold ${installed ? 'text-zinc-500' : 'text-zinc-400'}`}>{i + 1}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

/** Distinct from battery tier: maintenance health (inverse wear); fill shifts purple → navy → orange → red. */
function MaintenanceWearBar(props: {
  wearRatio: number;
  onOpen?: () => void;
  embedded?: boolean;
  /** Dark marker at ~42% wear: KAS + patch unlock threshold. */
  showKasRepairThresholdMarker?: boolean;
}) {
  const health = clamp01(1 - props.wearRatio);
  const fill = maintenanceMeterFillCss(health);
  const pct = Math.round(health * 100);
  const widthPct = Math.max(2, pct);
  const kasThresholdWear = MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR;
  const kasMarkerWearPct = Math.round(Math.min(100, Math.max(0, kasThresholdWear * 100)) * 100) / 100;

  const maintenanceBarTooltip = gameTooltipRich(
    'Maintenance wear',
    'Wear builds the longer you run without service. Use maintenance when you want to pay for a reset; higher plant tiers give you more uptime between services.',
  );

  const kasMarkerTooltip = gameTooltipRich(
    'KAS payments',
    <>
      Around <strong>{Math.round(kasThresholdWear * 100)}% wear</strong>, paying with <strong>KAS</strong> opens up as long as you also use{' '}
      <strong>one Stability Patch</strong>. <strong>KREX</strong> payments stay available anytime with no wear gate.
    </>,
  );

  const barTrack = (
    <div className="relative h-1.5 w-full overflow-visible">
      <Tooltip content={maintenanceBarTooltip}>
        <div className="relative h-1.5 w-full cursor-help overflow-visible rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] overflow-hidden rounded-full" style={{ width: `${widthPct}%` }}>
            <div
              className="h-full w-full rounded-full transition-[width,background-color] duration-700"
              style={{ backgroundColor: fill }}
            />
          </div>
        </div>
      </Tooltip>
      {props.showKasRepairThresholdMarker ? (
        <Tooltip content={kasMarkerTooltip}>
          <div
            className="absolute top-1/2 z-[4] flex min-h-[22px] -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center px-2 py-0.5"
            style={{ left: `${kasMarkerWearPct}%` }}
          >
            <SectionStyleProgressMarker />
          </div>
        </Tooltip>
      ) : null}
    </div>
  );
  const inner = props.embedded ? (
    <div className="flex items-center gap-2">
      <span className="text-xs font-black tabular-nums transition-colors duration-700 shrink-0" style={{ color: fill }}>
        {pct}%
      </span>
      <div className="min-w-0 flex-1">{barTrack}</div>
    </div>
  ) : (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Maintenance</span>
        <span className="text-xs font-black tabular-nums transition-colors duration-700" style={{ color: fill }}>
          {pct}%
        </span>
      </div>
      {barTrack}
    </div>
  );
  const trigger = props.onOpen ? (
    <button
      type="button"
      onClick={() => props.onOpen?.()}
      className="w-full rounded-lg text-left outline-none ring-emerald-500/40 transition-colors hover:bg-zinc-50/80 focus-visible:ring-2 dark:hover:bg-zinc-900/40"
    >
      {inner}
    </button>
  ) : (
    inner
  );

  return trigger;
}

/** Inline warning banner */
function WarningBanner(props: { level: 'warn' | 'error'; message: string }) {
  const cls = props.level === 'error'
    ? 'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
    : 'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400';
  return <div className={cls}>{props.message}</div>;
}

// ── Main card ────────────────────────────────────────────────────────────────

export function PlantSlotCard(props: {
  minecoreState: MinecoreState;
  minecoreComputeContext?: MinecoreComputeContext;
  slot: PlantSlotState;
  /** Position in `minecoreState.plantSlots` - must match reducer slot index (resolved by stable id in parent). */
  slotArrayIndex: number;
  now: number;
  onUnlock: () => void;
  onStart: () => void;
  onExtract: () => void;
  /** Paid service: resets maintenance clock. Pass `consumeStabilityPatch` for early service (requires patch stock). Returns whether payment + dispatch succeeded. */
  onRepairPlant: (opts: { currency: 'KAS' | 'KREX'; consumeStabilityPatch: boolean }) => boolean | Promise<boolean>;
  stabilityPatches: number;
  /** Paid recharge: fills selected battery slot(s) after KAS send or KREX treasury transfer. */
  onRechargePlant: (opts?: {
    batterySlotIndex?: number;
    batterySlotIndexes?: number[];
    currency?: 'KAS' | 'KREX';
  }) => void | Promise<void>;
  onStopMining: () => void;
  onResumeMining: () => void;
  onInstallPart: (kind: any, id: any, batterySlotIndex?: number, workerSlotPosition?: number) => void;
  /** Single dispatch when assigning multiple crew deck links (avoids duplicate cycle resets). */
  onAssignPlantCrewDeckIndices: (indices: (number | null)[]) => void;
  onChangePlantType: (type: PlantType, cost: number, opts?: { confirmStandardDowngrade?: boolean }) => void;
  /** For refill modal pricing (KAS after KREX tier discount). */
  getKasPriceAfterDiscount?: (listKas: number) => number;
  /** Foreman NFT unlocks AUTO on the card; per-plant chaining when infra allows. */
  onTogglePlantAutoRestartMining?: (enabled: boolean) => void;
}) {
  /** Always read live slot from reducer-backed array so UI/actions cannot drift from `slotArrayIndex` (fixes stale/wrong `slot` prop). */
  const s = props.minecoreState.plantSlots[props.slotArrayIndex] ?? props.slot;
  const now = props.now;
  const ctx = props.minecoreComputeContext;
  const foremanInPlantCrew = minecorePlantHasForemanInCrew(props.minecoreState, s);

  const [activeModal, setActiveModal] = useState<'machine' | 'battery' | 'worker' | 'modules' | 'powerNode' | 'preset' | null>(null);
  const [batterySlotFocus, setBatterySlotFocus] = useState(0);
  const [batteryInstallConfirmId, setBatteryInstallConfirmId] = useState<MinecoreBatteryId | null>(null);
  const [batteryRemoveConfirmOpen, setBatteryRemoveConfirmOpen] = useState(false);
  const [batteryRefillModalOpen, setBatteryRefillModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [refillSlotIndexes, setRefillSlotIndexes] = useState<number[]>([]);
  const [refillPayCurrency, setRefillPayCurrency] = useState<'KAS' | 'KREX'>('KAS');
  const [repairPayCurrency, setRepairPayCurrency] = useState<'KAS' | 'KREX'>('KREX');
  const [standardDowngradeConfirmOpen, setStandardDowngradeConfirmOpen] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (batteryRefillModalOpen) setRefillPayCurrency('KAS');
  }, [batteryRefillModalOpen]);

  useEffect(() => {
    if (maintenanceModalOpen) setRepairPayCurrency('KREX');
  }, [maintenanceModalOpen]);

  useEffect(() => {
    setModalFeedback(null);
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== 'battery') {
      setBatteryInstallConfirmId(null);
      setBatteryRemoveConfirmOpen(false);
    }
  }, [activeModal]);

  useEffect(() => {
    if (batteryInstallConfirmId == null && !batteryRemoveConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setBatteryInstallConfirmId(null);
        setBatteryRemoveConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [batteryInstallConfirmId, batteryRemoveConfirmOpen]);

  const dispatchInstallPartPayload = useCallback(
    (part: InstallPartPayload) => {
      const nextSetup = nextPlantSetupAfterInstallPart(s, part);
      if (normalizedPlantSetupsEqual(s.type, s.setup, nextSetup)) return;
      switch (part.kind) {
        case 'machine':
          props.onInstallPart('machine', part.id);
          break;
        case 'battery':
          props.onInstallPart('battery', part.id, part.batterySlotIndex);
          break;
        case 'powerNodes':
          props.onInstallPart('powerNodes', part.ids);
          break;
        case 'modules':
          props.onInstallPart('modules', part.ids);
          break;
        default:
          break;
      }
    },
    [s, props.onInstallPart],
  );

  const assignCrewIfChanged = useCallback(
    (indices: (number | null)[]) => {
      const part: InstallPartPayload = { kind: 'crewWorkerNftDecks', indices };
      const nextSetup = nextPlantSetupAfterInstallPart(s, part);
      if (normalizedPlantSetupsEqual(s.type, s.setup, nextSetup)) return;
      props.onAssignPlantCrewDeckIndices(indices);
    },
    [s, props.onAssignPlantCrewDeckIndices],
  );

  // ── Live computed values ─────────────────────────────────────────────────
  const cycle = s.cycle;
  const powerUnitCount = getPlantBatterySlotCount(s.type);
  const liveChargeMs = computeLiveBatteryChargeMs(s, now);
  const liveSlotChargesRaw = s.unlocked ? computeLiveBatterySlotChargeMs(s, now) : [];
  const maxSlotChargesRaw = s.unlocked ? getMaxChargePerSlotMs(s.setup, s.type, 0) : [];
  const liveSlotCharges = s.unlocked ? ensureBatterySlotChargeLength(liveSlotChargesRaw, powerUnitCount, 0) : [];
  const maxSlotCharges = s.unlocked ? ensureBatterySlotChargeLength(maxSlotChargesRaw, powerUnitCount, 0) : [];
  const capacityMs = s.unlocked ? sumChargeMs(maxSlotCharges) : 0;
  const batteryRatio = capacityMs > 0 ? liveChargeMs / capacityMs : 0;
  const batteryLow = batteryRatio < 0.2 && batteryRatio > 0;
  const batteryEmpty = liveChargeMs <= 0 && cycle != null;
  /** Depleted mid-run (not paused): primary action should be Recharge, not duplicate with secondary button. */
  const batteryDeadInRun =
    s.status === 'BatteryEmpty' &&
    liveChargeMs <= 0 &&
    cycle != null &&
    cycle.pauseBeganAtMs == null;
  const batteryRuntimeMs = capacityMs > 0 && s.setup.machineId ? computeBatteryRuntimeMs(s, now) : 0;
  const miningMaxNominalMs = capacityMs > 0 && s.setup.machineId ? capacityMs : 0;

  const capRemainingMs = s.unlocked ? computeRollingDailyCapWindowRemainingMs(s, now) : 0;
  const dailyCap = computePlantDailyCapProgress(props.minecoreState, s, now, ctx);
  const capBreakdown = useMemo(
    () => computePlantRollingDailyCapBreakdown(props.minecoreState, s, ctx, now),
    [props.minecoreState, s, ctx, now],
  );
  const prodKw = s.unlocked ? computeProductionKw(s) : 0;
  const consKw = s.unlocked && s.setup.machineId ? computeConsumptionKw(s) : 0;
  const balKw = prodKw - consKw;
  const effGridPct = s.unlocked && s.setup.machineId ? computeMiningEfficiencyPct(s) : 100;
  const effDisplayPct = s.unlocked && s.setup.machineId ? computeEffectiveMiningEfficiencyPct(s, now) : 100;
  const wearRatio = s.unlocked ? computeMaintenanceWearRatio(s, now) : 0;
  const flowPerMin =
    s.unlocked && s.setup.machineId && s.cycle != null && s.cycle.pauseBeganAtMs == null
      ? computeFlowRatePerMin(props.minecoreState, s, now, ctx)
      : 0;

  // ── Config lookups ───────────────────────────────────────────────────────
  const machineConfig   = s.setup.machineId ? MINECORE_MACHINES[s.setup.machineId] : null;
  const powerNodeSlots = normalizePlantSetup(s.type, s.setup).powerNodeIds;
  const reactorBonusKw = powerNodeSlots.reduce(
    (sum, id) => sum + (id ? MINECORE_POWER_NODES[id]?.maxPowerKw ?? 0 : 0),
    0,
  );
  const reactorFilledCount = powerNodeSlots.filter(Boolean).length;
  const reactorLabels = powerNodeSlots
    .map((id) => (id ? MINECORE_POWER_NODES[id]?.label : null))
    .filter((x): x is string => x != null);
  const rigPowerBudgetMult = machineConfig?.powerBudgetMultiplier ?? 1;
  const energyBarDetail =
    s.unlocked && s.setup.machineId ? (
      <>
        <p>
          Bar max equals the summed pillar capacities ({formatDuration(capacityMs)}). Pillar stickers use shorter rounding only.
        </p>
        {rigPowerBudgetMult !== 1 ? (
          <p>This rig applies ×{rigPowerBudgetMult.toFixed(2)} to each pack&apos;s listed runtime (power budget multiplier).</p>
        ) : null}
      </>
    ) : null;
  const installedBatteryIndices = useMemo(() => {
    const ids = normalizeBatteryIds(s.setup, s.type);
    return ids.map((id, i) => (id ? i : null)).filter((x): x is number => x != null);
  }, [s.setup, s.type]);
  const setupReady = computePlantReady(props.minecoreState, s);
  const maintSlowdownPct =
    setupReady && s.setup.machineId
      ? Math.max(0, Math.min(100, Math.round(effGridPct - effDisplayPct)))
      : 0;

  const nftStaffSlots = props.minecoreState.nftSlots ?? [];

  const miningDeckRows = useMemo(() => {
    const slots = props.minecoreState.nftSlots ?? [];
    const rows = slots
      .map((slot, deckIdx) => ({ slot, deckIdx }))
      .filter(
        (x) =>
          x.slot.nftId != null &&
          x.slot.collection &&
          MINING_ASSIGNABLE_TYPES.some((t) => t === x.slot.type),
      );
    const tierOrder: Record<string, number> = { rarest: 0, diamond: 1, regular: 2 };
    rows.sort((a, b) => {
      const typeRank = (t: string) => MINING_ASSIGNABLE_TYPES.indexOf(t as (typeof MINING_ASSIGNABLE_TYPES)[number]);
      const tr = typeRank(a.slot.type) - typeRank(b.slot.type);
      if (tr !== 0) return tr;
      const af = a.slot.nftId != null ? 1 : 0;
      const bf = b.slot.nftId != null ? 1 : 0;
      if (af !== bf) return bf - af;
      if (!a.slot.nftId || !a.slot.collection) return 1;
      if (!b.slot.nftId || !b.slot.collection) return -1;
      const ta = getNFTTier(a.slot.collection, a.slot.nftId, ctx?.nftMetadataByDeckIndex?.[a.deckIdx] ?? null);
      const tb = getNFTTier(b.slot.collection, b.slot.nftId, ctx?.nftMetadataByDeckIndex?.[b.deckIdx] ?? null);
      const d = (tierOrder[ta] ?? 9) - (tierOrder[tb] ?? 9);
      if (d !== 0) return d;
      return a.slot.nftId - b.slot.nftId;
    });
    return rows;
  }, [props.minecoreState.nftSlots, ctx]);

  const workerIndices = normalizePlantSetup(s.type, s.setup).workerNftDeckSlotIndices;
  const needWorkers = miningWorkerNftSlotsRequired(s.type);
  const rigCrewNeed = fabricatedOperatorSlotsCapacity(s.setup.machineId);
  const crewPlantUndersized = Boolean(s.setup.machineId && rigCrewNeed > needWorkers);
  let workerFilled = 0;
  for (let i = 0; i < needWorkers; i++) {
    if (workerIndices[i] != null) workerFilled++;
  }

  const workerSetupDisplay = useMemo(
    () => describePlantWorkerAssignments(props.minecoreState, s, ctx),
    [props.minecoreState, s, ctx],
  );
  const crewCapRollup = useMemo(
    () => sumCrewRollingCapBonusFromAssignments(props.minecoreState, s, ctx),
    [props.minecoreState, s, ctx],
  );
  const moduleFlatCapBonus = useMemo(() => {
    let t = 0;
    for (const mid of s.setup.moduleIds) {
      t += MINECORE_MODULES[mid as MinecoreModuleId]?.diamondsPer24hFlat ?? 0;
    }
    return t;
  }, [s.setup.moduleIds]);
  const moduleRefineBonusFrac = useMemo(() => {
    let t = 0;
    for (const mid of s.setup.moduleIds) {
      t += MINECORE_MODULES[mid as MinecoreModuleId]?.refineBonus ?? 0;
    }
    return t;
  }, [s.setup.moduleIds]);
  const workerSetupValue = useMemo(() => {
    const { summary } = workerSetupDisplay;
    if (workerFilled === 0) return `${workerFilled}/${needWorkers}`;
    if (workerFilled < needWorkers) return `${workerFilled}/${needWorkers} · ${summary || '-'}`;
    return summary || `${workerFilled}/${needWorkers}`;
  }, [workerSetupDisplay, workerFilled, needWorkers]);
  const discountKas = props.getKasPriceAfterDiscount ?? ((x: number) => x);
  const refillPayKasRange = useMemo(() => {
    if (!s.unlocked || installedBatteryIndices.length === 0) {
      const one = discountKas(MINECORE_PLANT_RECHARGE_COST_KAS);
      return { min: one, max: one };
    }
    const prices = installedBatteryIndices.map((bi) =>
      discountKas(listKasForBatterySlotRecharge(props.minecoreState, s, bi, ctx)),
    );
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [s, props.minecoreState, ctx, installedBatteryIndices, props.getKasPriceAfterDiscount]);

  function openBatteryRefillModal(prefSlot?: number) {
    if (installedBatteryIndices.length === 0) return;
    if (prefSlot !== undefined && installedBatteryIndices.includes(prefSlot)) {
      setRefillSlotIndexes([prefSlot]);
    } else {
      setRefillSlotIndexes([...installedBatteryIndices]);
    }
    setBatteryRefillModalOpen(true);
  }

  function confirmBatteryRefill() {
    const sorted = [...refillSlotIndexes].sort((a, b) => a - b);
    if (sorted.length === 0) return;
    if (sorted.length === 1) void props.onRechargePlant({ batterySlotIndex: sorted[0], currency: refillPayCurrency });
    else void props.onRechargePlant({ batterySlotIndexes: sorted, currency: refillPayCurrency });
    setBatteryRefillModalOpen(false);
  }

  const fmtKas = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  let actionLabel: string;
  if (!s.unlocked) {
    actionLabel = `Activate ${fmtKas(discountKas(s.unlockCostKas))} KAS`;
  } else if (s.status === 'SetupIncomplete') {
    actionLabel = 'Complete setup';
  } else if (s.status === 'NeedsRepair') {
    actionLabel = `Repair - ${fmtKas(discountKas(MINECORE_PLANT_REPAIR_KAS))} KAS`;
  } else if (batteryDeadInRun || s.status === 'NeedsPower') {
    const rk = refillPayKasRange;
    const refillHint = rk.min === rk.max ? `${fmtKas(rk.min)} KAS` : `${fmtKas(rk.min)}-${fmtKas(rk.max)} KAS`;
    actionLabel = `Refill battery: ${refillHint}`;
  } else if (
    s.status === 'ReadyToMine' &&
    liveChargeMs <= 0 &&
    hasInstalledBattery(s.setup, s.type) &&
    s.setup.machineId
  ) {
    const rk = refillPayKasRange;
    const refillHint = rk.min === rk.max ? `${fmtKas(rk.min)} KAS` : `${fmtKas(rk.min)}-${fmtKas(rk.max)} KAS`;
    actionLabel = `Refill battery: ${refillHint}`;
  } else if (s.status === 'InsufficientPower') {
    actionLabel = 'Improve power balance';
  } else if (s.status === 'DailyCapReached') {
    actionLabel = '24h cap reached';
  } else if (s.status === 'MiningPaused') {
    actionLabel = 'Resume mining';
  } else if (s.status === 'MiningActive') {
    actionLabel = 'Stop mining';
  } else if (s.status === 'CreditingReady' || s.status === 'BatteryEmpty') {
    actionLabel = 'Run finished - crediting…';
  } else if (s.status === 'ReadyToMine') {
    actionLabel = 'Start';
  } else {
    actionLabel = 'Mining…';
  }

  const buyDisabled =
    s.status === 'DailyCapReached' || s.status === 'CreditingReady' || s.status === 'BatteryEmpty';

  /** Edit setup whenever plant is unlocked; changing parts ends an active run and banks mined diamonds to accumulation (same as pause swap). */
  const canEditParts = s.unlocked;

  const preset = MINECORE_PLANT_PRESETS[s.type ?? 'standard'];
  const IconComponent = (Icons as any)[preset.icon] ?? Icons.CircleDot;

  const showFeaturedPlantArt = s.unlocked;
  const plantFeaturedUrl = showFeaturedPlantArt ? preset.featuredImageUrl : undefined;
  const baseCapDisplay = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[s.type ?? 'standard'];
  const moduleSlots = MINECORE_MAX_MODULES_BY_PLANT[s.type ?? 'standard'];
  const crewTierCapacity = MINECORE_PLANT_WORKFORCE_CAPACITY[s.type ?? 'standard'];
  const batteryPillarTierCount = getPlantBatterySlotCount(s.type);
  const moduleOverlayBadge =
    moduleSlots <= 0 ? 'No modules' : `${moduleSlots} Module${moduleSlots === 1 ? '' : 's'}`;
  const statCapsuleCls =
    'inline-flex max-w-full items-center rounded-full border border-white/30 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm';

  const amberBatteryCtaCls =
    'h-10 w-full rounded-xl px-4 text-sm font-bold border-2 border-amber-500/60 bg-amber-500/25 text-amber-950 shadow-sm transition-colors hover:bg-amber-500/35 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-50 dark:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50';

  const wantsBatteryRefillCta =
    batteryDeadInRun ||
    s.status === 'NeedsPower' ||
    (s.status === 'ReadyToMine' &&
      liveChargeMs <= 0 &&
      hasInstalledBattery(s.setup, s.type) &&
      !!s.setup.machineId);

  /** Primary CTA: amber for pause / refill; neutral gray when mining; default games CTA otherwise. */
  const buyButtonClassName = wantsBatteryRefillCta
    ? amberBatteryCtaCls
    : s.status === 'MiningPaused'
      ? amberBatteryCtaCls
      : s.status === 'MiningActive'
        ? 'h-10 w-full rounded-xl px-4 text-sm font-bold border-2 border-zinc-300 bg-zinc-200 text-zinc-800 shadow-sm transition-colors hover:bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50'
        : undefined;

  return (
    <>
    <GameItemCard
      icon={
        !showFeaturedPlantArt ? (
          <Icons.Factory className="h-14 w-14 text-zinc-400 dark:text-zinc-500" aria-hidden />
        ) : plantFeaturedUrl ? undefined : (
          <div
            className={`group relative ${canEditParts ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
            onClick={() => canEditParts && setActiveModal('preset')}
          >
            <div className="absolute inset-0 bg-sky-500/10 rounded-full scale-125 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <IconComponent className="h-5 w-5 text-sky-400 group-hover:text-sky-300 transition-colors relative z-10" />
          </div>
        )
      }
      imageSrc={plantFeaturedUrl}
      imageAlt={preset.label}
      onMediaClick={showFeaturedPlantArt && plantFeaturedUrl && canEditParts ? () => setActiveModal('preset') : undefined}
      mediaTapTooltip={
        showFeaturedPlantArt && plantFeaturedUrl && canEditParts
          ? gameTooltipRich(
              'Click to Upgrade',
              <>
                Tap the plant image to open setup. Choose your mining plant tier and upgrade rigs, crew links, reactors,
                modules, and batteries from there.
              </>,
            )
          : undefined
      }
      mediaOverlayBottom={
        showFeaturedPlantArt && plantFeaturedUrl ? (
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Tooltip
              content={gameTooltipRich(
                'Base tier budget',
                <>
                  Reference D/24h for {preset.label} before rigs and modules change the ceiling.
                  <span className="mt-1 block font-mono">{baseCapDisplay.toLocaleString()} D</span>
                </>,
              )}
            >
              <span className={statCapsuleCls}>{baseCapDisplay.toLocaleString()} Diamonds</span>
            </Tooltip>
            <Tooltip
              content={gameTooltipRich(
                'Crew capacity',
                <>
                  {preset.label} supports {crewTierCapacity} crew position{crewTierCapacity === 1 ? '' : 's'}. Assign Crew-tab
                  NFT rows in Setup.
                </>,
              )}
            >
              <span className={`${statCapsuleCls} normal-case tracking-normal`}>{crewTierCapacity} Crew</span>
            </Tooltip>
            <Tooltip
              content={gameTooltipRich(
                'Battery pillars',
                <>
                  This plant tier has {batteryPillarTierCount} battery pillar{batteryPillarTierCount === 1 ? '' : 's'}. Each holds
                  one pack; pillars drain in order during a run.
                </>,
              )}
            >
              <span className={`${statCapsuleCls} normal-case tracking-normal`}>
                {batteryPillarTierCount} {batteryPillarTierCount === 1 ? 'Battery' : 'Batteries'}
              </span>
            </Tooltip>
            <Tooltip
              content={gameTooltipRich(
                'Module tier',
                moduleSlots <= 0
                  ? 'This plant tier cannot mount fabrication modules.'
                  : s.setup.moduleIds.length > 0
                    ? `Up to ${moduleSlots} slot${moduleSlots === 1 ? '' : 's'}. Equipped: ${s.setup.moduleIds.length}${
                        moduleFlatCapBonus > 0 ? ` · +${moduleFlatCapBonus} D/24h toward cap from modules` : ''
                      }. Tap Modules in setup to manage.`
                    : `Up to ${moduleSlots} module slot${moduleSlots === 1 ? '' : 's'}. See Modules in setup.`,
              )}
            >
              <span
                className={`${statCapsuleCls} normal-case tracking-normal inline-flex flex-wrap items-center gap-1`}
              >
                <span>{moduleOverlayBadge}</span>
                {moduleSlots > 0 && s.setup.moduleIds.length > 0 ? (
                  <StatBadge variant="emerald">
                    {moduleFlatCapBonus > 0
                      ? `+${moduleFlatCapBonus} D`
                      : `${s.setup.moduleIds.length} mod${s.setup.moduleIds.length === 1 ? '' : 's'}`}
                  </StatBadge>
                ) : null}
              </span>
            </Tooltip>
          </div>
        ) : undefined
      }
      title={`Mining Plant ${props.slotArrayIndex + 1}`}
      titleAccessory={
        s.unlocked ? (
          <div className="inline-flex max-w-[min(100%,22rem)] flex-wrap items-center justify-end gap-x-1.5 gap-y-1 sm:max-w-none">
            {setupReady && s.setup.machineId && maintSlowdownPct > 0 ? (
              <Tooltip
                content={gameTooltipRich(
                  'Maintenance slowdown',
                  <>
                    <p>
                      Grid-side efficiency is {effGridPct.toFixed(0)}%. Wear since last service reduces realized mining to{' '}
                      {effDisplayPct.toFixed(0)}%.
                    </p>
                    <p className="mt-1">
                      About −{maintSlowdownPct}% versus peak until you repair or service this plant (rolling cap math uses the same effective score).
                    </p>
                  </>,
                )}
              >
                <StatBadge variant="violet">−{maintSlowdownPct}%</StatBadge>
              </Tooltip>
            ) : null}
            <Tooltip
              content={gameTooltipRich(
                'Live yield rate',
                'Diamonds credited per minute at the current rig, batteries, crew, grid load, modules, and wear. Shaded when no mining run is active.',
              )}
            >
              <span
                className={`inline-block font-mono text-sm font-bold tabular-nums tracking-tight sm:text-base ${
                  setupReady && s.status === 'MiningActive'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-500'
                }`}
              >
                {(!setupReady ? 0 : Math.max(0, flowPerMin)).toFixed(1)} D/min
              </span>
            </Tooltip>
          </div>
        ) : undefined
      }
      category={preset.label}
      description={
        <div className="space-y-3">
          {s.unlocked ? (
            <DailyCapBar
              mined={dailyCap.minedTowardCap}
              cap={dailyCap.cap24h}
              ratio={dailyCap.ratio}
              forceZeroDisplay={!setupReady}
              counterMuted={!(setupReady && s.status === 'MiningActive')}
              capReached={dailyCap.cap24h > 0 && dailyCap.minedTowardCap >= dailyCap.cap24h}
              remainingMs={capRemainingMs}
              capStack={capBreakdown}
              upgradeMilestoneDiamonds={
                setupReady && nextPlantTier(s.type) != null ? plantTierUnlockDiamondThreshold(s.type) : null
              }
            />
          ) : null}

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content={tooltipForStatus(s.status)}>
              <KxBadge variant={plantStatusVariant(s.status)}>{labelForStatus(s.status)}</KxBadge>
            </Tooltip>
            {s.unlocked && s.setup.machineId ? (
              <Tooltip
                content={gameTooltipRich(
                  'Efficiency badge',
                  'Combines maintenance wear with grid load bands. Raise max power or trim draw for a healthier score.',
                )}
              >
                <KxBadge variant="cyan">Eff {effDisplayPct.toFixed(0)}%</KxBadge>
              </Tooltip>
            ) : null}
            {s.unlocked &&
            s.setup.moduleIds.includes('krex-boost') &&
            (s.krexBoostUntilMs ?? 0) > 0 &&
            now < (s.krexBoostUntilMs ?? 0) ? (
              <Tooltip
                content={gameTooltipRich(
                  'KREX Boost',
                  <>
                    <p>
                      One-time charge: buying adds inventory you equip here; when the timer ends (or you unequip while it is
                      running) that charge is consumed. Buy again for another run.
                    </p>
                    <p className="mt-1">
                      Active for {Math.round(MINECORE_KREX_BOOST_DURATION_MS / 3_600_000)} hour
                      {Math.round(MINECORE_KREX_BOOST_DURATION_MS / 3_600_000) === 1 ? '' : 's'} · diamond yield ×
                      {MINECORE_KREX_BOOST_YIELD_MULT.toFixed(1)} while mounted.
                    </p>
                  </>,
                )}
              >
                <KxBadge variant="violet">KREX Boost</KxBadge>
              </Tooltip>
            ) : null}
            {s.unlocked &&
            (((s.kasOverclockDailyBonusUntilMs ?? 0) > 0 &&
              now < (s.kasOverclockDailyBonusUntilMs ?? 0)) ||
              (s.kasOverclockNextCycleExtraDiamonds ?? 0) > 0) ? (
              <Tooltip
                content={gameTooltipRich(
                  'KAS Overclock',
                  'Temporarily boosts the rolling cap ceiling and/or adds flat diamonds to your next completed cycle.',
                )}
              >
                <KxBadge variant="amber">Overclock</KxBadge>
              </Tooltip>
            ) : null}
            {s.unlocked ? (
              !foremanInPlantCrew ? (
                <Tooltip
                  content={gameTooltipRich(
                    'AUTO locked',
                    'Link a Foreman from the Crew tab into this plant’s Crew row in Mining setup. Worker or Operator NFTs alone do not unlock AUTO.',
                  )}
                >
                  <KxBadge variant="zinc" className="opacity-80">
                    Auto · off
                  </KxBadge>
                </Tooltip>
              ) : (
                <Tooltip
                  content={gameTooltipRich(
                    'Per-plant AUTO',
                    'When on, starts another run after a cycle ends if batteries still carry charge. Requires this Foreman link on the Crew row. Automation never buys refills — tap to toggle.',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => props.onTogglePlantAutoRestartMining?.(!s.autoRestartMining)}
                    className={`${kxBadgeClassName(s.autoRestartMining ? 'sky' : 'zinc')} cursor-pointer transition-opacity hover:opacity-90`}
                  >
                    Auto {s.autoRestartMining ? 'on' : 'off'}
                  </button>
                </Tooltip>
              )
            ) : null}
          </div>

          <button
            type="button"
            disabled={buyDisabled}
            onClick={() => {
              if (!s.unlocked) return props.onUnlock();
              if (s.status === 'SetupIncomplete') return setActiveModal('machine');
              if (s.status === 'NeedsRepair') return setMaintenanceModalOpen(true);
              if (s.status === 'InsufficientPower') return setActiveModal('powerNode');
              if (s.status === 'DailyCapReached') return;
              if (
                batteryDeadInRun ||
                s.status === 'NeedsPower' ||
                (s.status === 'ReadyToMine' &&
                  liveChargeMs <= 0 &&
                  installedBatteryIndices.length > 0)
              )
                return openBatteryRefillModal();
              if (s.status === 'MiningPaused') return props.onResumeMining();
              if (s.status === 'MiningActive') return props.onStopMining();
              if (s.status === 'CreditingReady' || s.status === 'BatteryEmpty') return;
              if (s.status === 'ReadyToMine') return props.onStart();
            }}
            className={
              buyButtonClassName ??
              'k-cta-games h-10 w-full rounded-xl px-4 text-sm font-bold disabled:opacity-50 disabled:grayscale'
            }
          >
            {actionLabel}
          </button>

          {s.unlocked ? (
            <>
              <UnifiedBatterySegmentsBar
                liveSlotMs={liveSlotCharges}
                maxSlotMs={maxSlotCharges}
                miningLeftMs={batteryRuntimeMs}
                miningMaxMs={miningMaxNominalMs}
                liveChargeMs={liveChargeMs}
                capacityMs={capacityMs}
                energyDetail={energyBarDetail}
                onSlotPress={(slotIdx, installed) => {
                  if (!installed) {
                    setBatterySlotFocus(slotIdx);
                    setActiveModal('battery');
                  } else {
                    openBatteryRefillModal(slotIdx);
                  }
                }}
              />
              {s.status === 'CreditingReady' && liveChargeMs > 0 ? (
                <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-[10px] font-semibold text-amber-900 dark:text-amber-200">
                  Rolling 24h cap is full, so mining stopped even though runtime remains. Refine on-plant diamonds, wait for the cap
                  window, raise your ceiling, or use Extract flow as usual.
                </p>
              ) : null}
            </>
          ) : null}

          {/* ── Setup checklist ── */}
          <div className="space-y-0.5 rounded-xl border border-zinc-100 bg-white/60 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="mb-1 px-2 pt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Setup</div>
            <div className="max-h-[220px] space-y-0.5 overflow-y-auto px-1 pr-2 custom-scrollbar">
            {crewPlantUndersized ? (
              <WarningBanner
                level="warn"
                message={`${machineConfig?.label ?? 'This rig'} needs ${rigCrewNeed} staffed crew links; ${preset.label} supports ${needWorkers}. Upgrade the plant or swap rigs.`}
              />
            ) : null}
            <CheckRow
              installed={plantNftSlotAssignmentValid(props.minecoreState, s)}
              label="Crew"
              value={workerSetupValue}
              badges={limitSetupBadges(
                <>
                  {crewCapRollup.totalCapBonus > 0 ? (
                    <StatBadge key="crew-cap-total" variant="emerald">
                      +{crewCapRollup.totalCapBonus} D
                    </StatBadge>
                  ) : null}
                  {crewCapRollup.hasForemanAuto ? (
                    <StatBadge key="foreman-auto" variant="amber">
                      AUTO
                    </StatBadge>
                  ) : null}
                </>,
              )}
              tooltip={gameTooltipRich(
                'Crew',
                <>
                  <p>
                    {preset.label} has {needWorkers} crew position{needWorkers === 1 ? '' : 's'}. Link distinct Crew-tab NFT rows (Worker / Operator / Foreman roles).
                    Each adds rolling-cap and battery bonuses per collection tier.
                  </p>
                  {machineConfig ? (
                    <p className="mt-1">
                      Your rig ({machineConfig.label}) needs {rigCrewNeed} staffed crew link{rigCrewNeed === 1 ? '' : 's'} before mining can start.
                    </p>
                  ) : null}
                </>,
              )}
              onClick={() => setActiveModal('worker')}
              disabled={!canEditParts}
            />
            <CheckRow
              installed={!!s.setup.machineId}
              label="Machines"
              value={machineConfig?.label}
              badges={
                machineConfig
                  ? limitSetupBadges(<StatBadge variant="emerald">+{machineConfig.diamondsPer24h} D</StatBadge>)
                  : undefined
              }
              tooltip={
                machineConfig
                  ? gameTooltipRich(
                      machineConfig.label,
                      <>
                        <p>
                          +{machineConfig.diamondsPer24h} D/24h toward rolling cap · ×
                          {machineConfig.miningSpeedMultiplier.toFixed(2)} mining speed ·{' '}
                          {formatMinecorePowerDisplay(machineConfig.powerConsumptionFactor * MINECORE_KW_SCALE)} draw.
                        </p>
                        <p className="mt-1">Tap to swap rigs from inventory.</p>
                      </>,
                    )
                  : gameTooltipRich('Mining rig', 'Pick a machine for this plant.')
              }
              onClick={() => setActiveModal('machine')}
              disabled={!canEditParts}
            />
            {moduleSlots > 0 ? (
              <CheckRow
                installed={s.setup.moduleIds.length > 0}
                label="Modules"
                value={
                  s.setup.moduleIds.length > 0
                    ? `${s.setup.moduleIds.length} equipped · tap to manage`
                    : 'None equipped · tap to add'
                }
                badges={limitSetupBadges(
                  <>
                    {moduleFlatCapBonus > 0 ? (
                      <StatBadge variant="emerald">+{moduleFlatCapBonus} cap</StatBadge>
                    ) : null}
                    {moduleRefineBonusFrac > 0 ? (
                      <StatBadge variant="violet">+{Math.round(moduleRefineBonusFrac * 100)}% refine</StatBadge>
                    ) : null}
                  </>,
                )}
                tooltip={gameTooltipRich(
                  'Modules',
                  `Up to ${moduleSlots} fabrication module slot${moduleSlots === 1 ? '' : 's'} on this plant tier. Output modules add flat rolling cap; refining modules add refinement yield on Redeem.`,
                )}
                onClick={() => setActiveModal('modules')}
                disabled={!canEditParts}
              />
            ) : null}
            <CheckRow
              installed={reactorFilledCount > 0}
              label="Power"
              value={
                reactorFilledCount === 0
                  ? 'Optional - tap to add reactors'
                  : reactorFilledCount === 1 && reactorLabels[0]
                    ? `${reactorLabels[0]} · tap to manage`
                    : `${reactorFilledCount} reactors · tap to manage`
              }
              badges={
                reactorBonusKw > 0 ? (
                  <StatBadge variant="amber">+{reactorBonusKw} kW max</StatBadge>
                ) : undefined
              }
              tooltip={
                reactorFilledCount === 0
                  ? gameTooltipRich(
                      'Reactor slots',
                      'Optional reactors crafted in Build. Raises max plant power so heavy rigs stay in a safe load band.',
                    )
                  : reactorFilledCount === 1 && reactorLabels[0]
                    ? gameTooltipRich(
                        reactorLabels[0],
                        <>
                          Adds +{reactorBonusKw} kW to max plant power. Tap to add, remove, or reorder assignments.
                        </>,
                      )
                    : gameTooltipRich(
                        'Reactors',
                        <>
                          <p>+{reactorBonusKw} kW total max power from this plant&apos;s reactors.</p>
                          <p className="mt-1">{reactorLabels.join(' · ')}</p>
                        </>,
                      )
              }
              onClick={() => setActiveModal('powerNode')}
              disabled={!canEditParts}
            />
            {Array.from({ length: powerUnitCount }, (_, bi) => {
              const bid = s.setup.batteryIds[bi] ?? null;
              const bcfg = bid ? MINECORE_BATTERIES[bid] : null;
              const maxEff = maxSlotCharges[bi] ?? 0;
              return (
                <CheckRow
                  key={bi}
                  installed={!!bid}
                  label={powerUnitCount > 1 ? `Battery ${bi + 1}` : 'Battery'}
                  value={bcfg?.label}
                  badges={
                    bid
                      ? limitSetupBadges(
                          <>
                            {maxEff > 0 ? (
                              <StatBadge variant="sky">{formatShortBatterySlotRuntime(maxEff)} max</StatBadge>
                            ) : null}
                          </>,
                        )
                      : undefined
                  }
                  tooltip={
                    bcfg
                      ? gameTooltipRich(
                          `${bcfg.label}`,
                          <>
                            <p>Stored energy for mining cycles. Tap to swap packs or refill from treasury.</p>
                            <p className="mt-1">
                              Drain this pillar to empty stored runtime before you can change or remove the battery type.
                            </p>
                          </>,
                        )
                      : gameTooltipRich(
                          powerUnitCount > 1 ? `Battery pillar ${bi + 1}` : 'Battery',
                          <>
                            <p>
                              Pick a fabricated battery pack. Each pillar holds one unit; earlier pillars drain first during a
                              run.
                            </p>
                            <p className="mt-1">
                              After you mount a pack, drain it empty before you can change or remove that battery type.
                            </p>
                          </>,
                        )
                  }
                  onClick={() => {
                    setBatterySlotFocus(bi);
                    setActiveModal('battery');
                  }}
                  disabled={!canEditParts}
                />
              );
            })}
            </div>
          </div>

          {/* ── Resource bars ── */}
          {s.unlocked && s.setup.machineId ? (
            <div className="rounded-xl border border-zinc-100 bg-white/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="mb-1 pt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Power grid</div>
              <PowerGridBalanceBar prodKw={prodKw} consKw={consKw} balKw={balKw} />
            </div>
          ) : null}

          {s.unlocked ? (
            <div className="rounded-xl border border-zinc-100 bg-white/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="mb-1 pt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Maintenance</div>
              <MaintenanceWearBar wearRatio={wearRatio} embedded showKasRepairThresholdMarker onOpen={() => setMaintenanceModalOpen(true)} />
            </div>
          ) : null}

          {/* ── Status warnings (above primary action) ── */}
          <div className="space-y-2">
            {s.status === 'DailyCapReached' && (
              <WarningBanner
                level="warn"
                message={`Rolling 24h extraction cap (${formatCapResetCountdown(capRemainingMs)} left). Raise ceiling, wait for rollover, or refine diamonds still on this plant. Extract→wallet gems still count until the window resets.`}
              />
            )}
            {s.status === 'SetupIncomplete' && (
              <WarningBanner
                level="warn"
                message={`✗ Missing: ${[!s.setup.machineId && 'Machine', !hasInstalledBattery(s.setup, s.type) && 'Battery', !plantNftSlotAssignmentValid(props.minecoreState, s) && 'Crew'].filter(Boolean).join(', ')}`}
              />
            )}
            {batteryEmpty && s.status !== 'MiningPaused' && (
              <WarningBanner
                level="error"
                message="Battery empty - run stopped and diamonds credited. Recharge a battery slot to mine again."
              />
            )}
            {batteryLow && !batteryEmpty && s.status !== 'MiningPaused' && (
              <WarningBanner
                level="warn"
                message={`Low battery (~${formatDuration(batteryRuntimeMs)}). Recharge soon.`}
              />
            )}
            {s.status === 'InsufficientPower' && (
              <WarningBanner
                level="warn"
                message={`Not enough power - ${formatMinecorePowerDisplay(prodKw)} supply vs ${formatMinecorePowerDisplay(consKw)} draw (${balKw >= 0 ? '+' : '−'}${formatMinecorePowerDisplay(Math.abs(balKw))}). Aim for ~${effGridPct.toFixed(0)}% grid efficiency (lighter rig or more production).`}
              />
            )}
            {s.status === 'NeedsPower' && (
              <WarningBanner
                level="error"
                message="Open battery refill - pay per slot with KAS or KREX from your L1 wallet. Tap a battery pillar above."
              />
            )}
            {s.status === 'NeedsRepair' && (
              <WarningBanner level="error" message="Maintenance due - efficiency wore down over time. Repair to restore full output." />
            )}
          </div>
        </div>
      }
      effects={[]}
      hidePricing={true}
      hideBuyButton
      priceOptions={[{ currency: 'KAS', unitPrice: 0 }]}
      buyLabel={actionLabel}
      buyDisabled={buyDisabled}
      buyButtonClassName={buyButtonClassName}
      onBuy={async () => {
        if (!s.unlocked) return props.onUnlock();
        if (s.status === 'SetupIncomplete') return setActiveModal('machine');
        if (s.status === 'NeedsRepair') return setMaintenanceModalOpen(true);
        if (s.status === 'InsufficientPower') return setActiveModal('machine');
        if (s.status === 'DailyCapReached') return;
        if (
          batteryDeadInRun ||
          s.status === 'NeedsPower' ||
          (s.status === 'ReadyToMine' && liveChargeMs <= 0 && installedBatteryIndices.length > 0)
        )
          return openBatteryRefillModal();
        if (s.status === 'MiningPaused') return props.onResumeMining();
        if (s.status === 'MiningActive') return props.onStopMining();
        if (s.status === 'CreditingReady' || s.status === 'BatteryEmpty') return;
        if (s.status === 'ReadyToMine') return props.onStart();
      }}
    />

    {/* ── Selection Modals ── */}
      <SelectionModal
        isOpen={batteryRefillModalOpen}
        onClose={() => setBatteryRefillModalOpen(false)}
        title="Battery refill"
      >
        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Route fresh charge into the slots you pick - the yard bleeds cells until those stacks read full again.
        </p>
        <div className="mb-4 grid gap-2">
          {installedBatteryIndices.map((idx) => {
            const on = refillSlotIndexes.includes(idx);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/30"
              >
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Slot {idx + 1}</span>
                <ToggleSwitch
                  checked={on}
                  onChange={(next) =>
                    setRefillSlotIndexes((prev) =>
                      next ? [...prev, idx].sort((a, b) => a - b) : prev.filter((x) => x !== idx),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {(() => {
            const sorted = [...refillSlotIndexes].sort((a, b) => a - b);
            const listKas = sumListKasForBatterySlotRecharge(props.minecoreState, s, sorted, ctx);
            const payKas = (props.getKasPriceAfterDiscount ?? ((x: number) => x))(listKas);
            const payKrex = payKas * MINECORE_KREX_PER_KAS;
            return (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <GameCurrencyMenu
                  ariaLabel="Battery refill payment currency"
                  value={refillPayCurrency}
                  onChange={(v) => setRefillPayCurrency(v as 'KAS' | 'KREX')}
                  options={[
                    {
                      value: 'KAS',
                      label: `${payKas.toLocaleString(undefined, { maximumFractionDigits: 6 })} KAS (wallet)`,
                    },
                    {
                      value: 'KREX',
                      label: `${payKrex.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX (L1 wallet)`,
                    },
                  ]}
                  className="min-w-0 flex-1"
                  buttonClassName="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                />
                <button
                  type="button"
                  disabled={refillSlotIndexes.length === 0}
                  className="k-cta-games h-11 min-w-[12rem] flex-[1.15] px-8 text-sm font-bold disabled:opacity-50 disabled:grayscale sm:min-w-[14rem]"
                  onClick={() => confirmBatteryRefill()}
                >
                  Pay & refill
                </button>
              </div>
            );
          })()}
        </div>
      </SelectionModal>

      <SelectionModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        title="Plant maintenance"
      >
        <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Crews rebalance brakes, replace filters, and re-seat bus links until efficiency climbs back toward spec.
        </p>
        {(() => {
          const patches = Math.max(0, Math.floor(props.stabilityPatches ?? 0));
          const healthPct = Math.round(clamp01(1 - wearRatio) * 100);
          const kasRepairAllowed =
            patches >= 1 && wearRatio >= MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR - 1e-9;
          const payKas = (props.getKasPriceAfterDiscount ?? ((x: number) => x))(MINECORE_PLANT_REPAIR_KAS);
          const payKrex = payKas * MINECORE_KREX_PER_KAS;
          const payDisabled = repairPayCurrency === 'KAS' ? !kasRepairAllowed : false;
          return (
            <>
              <div className="mb-4 rounded-xl border border-zinc-100 bg-white/60 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Plant health </span>
                <span className="tabular-nums text-violet-600 dark:text-violet-400">{healthPct}%</span>
                <span className="text-zinc-500 dark:text-zinc-400"> · Stability Patches: </span>
                <span className="font-bold tabular-nums text-zinc-800 dark:text-zinc-100">{patches}</span>
              </div>
              <p className="mb-3 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                <strong>KREX:</strong> Pay the listed service fee anytime to reset maintenance (no Stability Patch).
                <span className="mt-1 block">
                  <strong>KAS:</strong> Requires 1 Stability Patch plus the fee once wear reaches about{' '}
                  {Math.round(MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR * 100)}% or more.
                </span>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <GameCurrencyMenu
                  ariaLabel="Maintenance payment currency"
                  value={repairPayCurrency}
                  onChange={(v) => setRepairPayCurrency(v as 'KAS' | 'KREX')}
                  options={[
                    {
                      value: 'KAS',
                      label: `${payKas.toLocaleString(undefined, { maximumFractionDigits: 6 })} KAS + 1 patch`,
                    },
                    {
                      value: 'KREX',
                      label: `${payKrex.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`,
                    },
                  ]}
                  className="min-w-0 flex-1"
                  buttonClassName="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                />
                <button
                  type="button"
                  disabled={payDisabled}
                  className="k-cta-games h-11 min-w-[12rem] flex-[1.15] px-8 text-sm font-bold disabled:opacity-45 disabled:grayscale sm:min-w-[14rem]"
                  onClick={async () => {
                    const ok = await props.onRepairPlant({
                      currency: repairPayCurrency,
                      consumeStabilityPatch: repairPayCurrency === 'KAS',
                    });
                    if (ok) setMaintenanceModalOpen(false);
                  }}
                >
                  Pay & service ({repairPayCurrency === 'KAS' ? `${payKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS` : `${payKrex.toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`})
                </button>
              </div>
              {repairPayCurrency === 'KAS' && !kasRepairAllowed ? (
                <p className="mt-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                  Need at least 1 Stability Patch and ~{Math.round(MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR * 100)}%+ wear for KAS.
                  Use KREX to service immediately, add patches from the Shop, or wait for more wear.
                </p>
              ) : null}
            </>
          );
        })()}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'preset'}
        onClose={() => setActiveModal(null)}
        title="Upgrade Plant"
      >
        <p className="mb-3 text-sm leading-snug text-zinc-600 dark:text-zinc-400">
          Unlock the next tier by reaching <strong>{(MINECORE_PLANT_UPGRADE_CAP_MILESTONE_FRAC * 100).toFixed(0)}%</strong> of this
          plant&apos;s max rolling cap <strong>once</strong> (mined + banked + live run in the current 24h window). Downgrades only go to Standard and reset setup (confirm first).
        </p>
        <ul className="space-y-2">
          {MINECORE_PLANT_TYPE_ORDER.map((typeKey) => {
            const p = MINECORE_PLANT_PRESETS[typeKey];
            const Icon = (Icons as any)[p.icon] ?? Icons.CircleDot;
            const rowIdx = plantTierOrderIndex(p.type);
            const curIdx = plantTierOrderIndex(s.type);
            const isCurrent = p.type === s.type;
            const isStandardDowngradeRow = p.type === 'standard' && s.type !== 'standard';
            const isNextTier = rowIdx === curIdx + 1;
            const milestoneDone = tierCapMilestoneRecorded(s);
            const illegalMidTierDowngrade = rowIdx < curIdx && p.type !== 'standard';
            const rowDisabled =
              illegalMidTierDowngrade ||
              (!isCurrent && !isStandardDowngradeRow && !(isNextTier && milestoneDone));
            const buttonDisabled = rowDisabled && !isStandardDowngradeRow;

            let lockTip: ReactNode | undefined;
            if (illegalMidTierDowngrade) {
              lockTip = gameTooltipRich('Unavailable', 'You can only downgrade to Standard Plant (with confirmation).');
            } else if (!isCurrent && !isStandardDowngradeRow && isNextTier && !milestoneDone) {
              const need = plantTierUnlockDiamondThreshold(s.type);
              const capMax = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[s.type];
              lockTip = gameTooltipRich(
                'Next tier locked',
                <>
                  Mine at least {need.toLocaleString()} diamonds toward this plant&apos;s rolling cap while on{' '}
                  {MINECORE_PLANT_PRESETS[s.type].label} ({(MINECORE_PLANT_UPGRADE_CAP_MILESTONE_FRAC * 100).toFixed(0)}%
                  of that tier&apos;s {capMax.toLocaleString()} max). Progress includes credited mined total plus banked and
                  live run diamonds in the current window.
                </>,
              );
            } else if (!isCurrent && !isStandardDowngradeRow && rowIdx > curIdx + 1) {
              lockTip = gameTooltipRich('Unavailable', 'Purchase each higher tier in order. Unlock the next step first.');
            }

            const rowLockedMuted = rowDisabled && !isCurrent;

            const borderCls = isCurrent
              ? 'border-emerald-500 bg-emerald-500/5 dark:border-emerald-500/60'
              : rowDisabled
                ? 'border-zinc-200 bg-zinc-100/70 dark:border-zinc-700 dark:bg-zinc-900/45'
                : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600';

            const baseD = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[p.type];
            const maxD = MINECORE_PLANT_MAX_DIAMONDS_PER_24H[p.type];
            const crew = MINECORE_PLANT_WORKFORCE_CAPACITY[p.type];
            const pillars = MINECORE_PLANT_BASE_POWER_UNITS[p.type];
            const modSlots = MINECORE_MAX_MODULES_BY_PLANT[p.type];
            const statsLine = `${baseD.toLocaleString()} → ${maxD.toLocaleString()} max D/24h · ${crew} crew · ${pillars} battery pillar${
              pillars === 1 ? '' : 's'
            } · ${modSlots} module slot${modSlots === 1 ? '' : 's'}`;

            const rowBtn = (
              <button
                type="button"
                disabled={buttonDisabled}
                onClick={() => {
                  if (isCurrent) {
                    setActiveModal(null);
                    return;
                  }
                  if (isStandardDowngradeRow) {
                    setStandardDowngradeConfirmOpen(true);
                    return;
                  }
                  if (rowDisabled) return;
                  void props.onChangePlantType(p.type, p.costKas);
                  setActiveModal(null);
                }}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${borderCls}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 ${rowLockedMuted ? 'opacity-55 grayscale' : ''}`}
                  >
                    {p.featuredImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.featuredImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon
                        className={`h-5 w-5 ${rowLockedMuted ? 'text-zinc-400 dark:text-zinc-500' : 'text-emerald-600 dark:text-emerald-400'}`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-bold text-sm ${rowLockedMuted ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}
                    >
                      {p.label}
                    </div>
                    <div
                      className={`text-[11px] leading-snug ${rowLockedMuted ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                      {p.description}
                    </div>
                    <div
                      className={`mt-1 text-[10px] font-semibold leading-snug ${rowLockedMuted ? 'text-zinc-500 dark:text-zinc-500' : 'text-emerald-700 dark:text-emerald-400/90'}`}
                    >
                      {statsLine}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div className="flex min-w-[4rem] flex-col items-end">
                    <span className="text-[10px] font-semibold text-zinc-400">Upgrade</span>
                    <span
                      className={`font-mono text-sm font-bold tabular-nums ${rowLockedMuted ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}
                    >
                      {p.costKas <= 0 ? '-' : `${discountKas(p.costKas).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`}
                    </span>
                  </div>
                  <div className="flex min-w-[3.5rem] flex-col items-end">
                    <span className="text-[10px] font-semibold text-zinc-400">Status</span>
                    <span
                      className={`text-xs font-bold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : rowLockedMuted ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                      {isCurrent ? 'Current' : rowLockedMuted ? 'Locked' : '-'}
                    </span>
                  </div>
                  {isCurrent ? <Icons.Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : null}
                </div>
              </button>
            );

            return (
              <li key={p.type} className="list-none">
                {lockTip ? (
                  <Tooltip content={lockTip}>
                    <span className="block w-full">{rowBtn}</span>
                  </Tooltip>
                ) : (
                  rowBtn
                )}
              </li>
            );
          })}
        </ul>
      </SelectionModal>

      {standardDowngradeConfirmOpen && typeof window !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              role="presentation"
              onClick={() => setStandardDowngradeConfirmOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="standard-downgrade-title"
                className="max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 id="standard-downgrade-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Downgrade to Standard Plant?
                </h4>
                <p className="mt-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  This resets all setups on this plant: rigs, batteries (charge clears), crew links, reactors, and modules
                  return to inventory rules from here; plant tier milestones reset. To climb tiers again you pay upgrade KAS
                  costs from Standard upward. This does not refund past upgrades.
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStandardDowngradeConfirmOpen(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void props.onChangePlantType('standard', 0, { confirmStandardDowngrade: true });
                      setStandardDowngradeConfirmOpen(false);
                      setActiveModal(null);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    I understand
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <SelectionModal
        isOpen={activeModal === 'machine'}
        onClose={() => setActiveModal(null)}
        title="Assign Machine"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            {modalFeedback}
          </p>
        ) : null}
        <ul className="space-y-2">
          {Object.values(MINECORE_MACHINES).map((m) => {
            const owned = props.minecoreState.owned.machines[m.id] ?? 0;
            const assignedElsewhere = countMachinesAssignedExcept(props.minecoreState.plantSlots, m.id, props.slotArrayIndex);
            const canPick = assignedElsewhere + 1 <= owned;
            const isInstalled = s.setup.machineId === m.id;
            const rowBlocked = !canPick && !isInstalled;
            return (
              <li key={m.id} className="list-none">
                <ModalPartRow
                  title={m.label}
                  subtitle={`+${m.diamondsPer24h} D/24h cap · ${formatDuration(m.durationMs)} · ×${m.miningSpeedMultiplier.toFixed(2)} mining speed · +${(m.powerGridContribution * MINECORE_KW_SCALE).toFixed(0)} kW bus · Budget ×${m.powerBudgetMultiplier.toFixed(2)}`}
                  owned={owned}
                  inUse={displayAssignedCount(countMachinesAssigned(props.minecoreState.plantSlots, m.id), owned)}
                  disabled={rowBlocked}
                  disabledHint={
                    rowBlocked
                      ? owned <= 0
                        ? 'Craft this rig in Fabrication - none owned.'
                        : 'Every owned unit of this type is already on plants (inventory limits).'
                      : undefined
                  }
                  selected={isInstalled}
                  onClick={() => {
                    if (s.setup.machineId === m.id) {
                      setActiveModal(null);
                      return;
                    }
                    dispatchInstallPartPayload({ kind: 'machine', id: m.id });
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <ModalActionRow
          title="Remove machine"
          subtitle="Returns rig to inventory and clears cycle bank from setup edits."
          destructive
          disabled={!s.setup.machineId}
          onClick={() => {
            dispatchInstallPartPayload({ kind: 'machine', id: null });
            setActiveModal(null);
          }}
        />
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'powerNode'}
        onClose={() => setActiveModal(null)}
        title="Assign reactors"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            {modalFeedback}
          </p>
        ) : null}
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Tap a row to toggle. This plant has {powerNodeSlots.length} reactor slot
          {powerNodeSlots.length === 1 ? '' : 's'} (matches reserve-unit pillars). Craft reactors in Build - optional;
          they add max power (kW).
        </p>
        <ul className="space-y-2">
          {Object.values(MINECORE_POWER_NODES).map((node) => {
            const owned = props.minecoreState.owned.nodes[node.id] ?? 0;
            const cntHere = powerNodeSlots.filter((x) => x === node.id).length;
            const isSelected = cntHere > 0;
            const nextIfAdd = togglePowerNodeSlotAssignment(powerNodeSlots, node.id, 'add');
            const slotsFull = !powerNodeSlots.some((x) => x == null);
            const reactorAddBlocked =
              !isSelected &&
              (slotsFull ||
                !inventoryAllowsPlantSetup(props.minecoreState, props.slotArrayIndex, {
                  ...s.setup,
                  powerNodeIds: nextIfAdd,
                }));
            const rowBlocked = reactorAddBlocked && !isSelected;
            const blockReason =
              slotsFull && !isSelected
                ? 'All reactor slots are full - remove one or upgrade plant tier.'
                : explainPlantSetupBlock(props.minecoreState, props.slotArrayIndex, {
                    ...s.setup,
                    powerNodeIds: nextIfAdd,
                  }) ??
                  (owned <= 0
                    ? 'Craft this reactor in Build - none owned.'
                    : 'Every owned unit of this type is already on plants.');
            return (
              <li key={node.id} className="list-none">
                <ModalPartRow
                  title={node.label}
                  subtitle={`+${node.maxPowerKw} kW max power · stacks with plant tier and rig bus`}
                  owned={owned}
                  inUse={displayAssignedCount(countPowerNodesAssigned(props.minecoreState.plantSlots, node.id), owned)}
                  disabled={rowBlocked}
                  disabledHint={rowBlocked ? blockReason : undefined}
                  selected={isSelected}
                  onClick={() => {
                    if (rowBlocked && !isSelected) return;
                    const next = isSelected
                      ? togglePowerNodeSlotAssignment(powerNodeSlots, node.id, 'remove')
                      : nextIfAdd;
                    dispatchInstallPartPayload({ kind: 'powerNodes', ids: next });
                  }}
                  trailing={
                    isSelected ? (
                      cntHere > 1 ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
                          ×{cntHere}
                        </span>
                      ) : (
                        <Icons.Check className="h-5 w-5 shrink-0 self-center text-emerald-600 dark:text-emerald-400" />
                      )
                    ) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
        <ModalActionRow
          title="Clear all reactors"
          subtitle="Returns every reactor on this plant to inventory."
          destructive
          disabled={!powerNodeSlots.some(Boolean)}
          onClick={() => {
            dispatchInstallPartPayload({
              kind: 'powerNodes',
              ids: Array.from({ length: getPlantPowerNodeSlotCount(s.type) }, () => null),
            });
            setActiveModal(null);
          }}
        />
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'battery'}
        onClose={() => setActiveModal(null)}
        title={powerUnitCount > 1 ? `Assign battery - power unit ${batterySlotFocus + 1}` : 'Assign Battery'}
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            {modalFeedback}
          </p>
        ) : null}
        {(() => {
          const pillarDrained = isBatteryPillarDrained(s, batterySlotFocus, now);
          const curAtPillar = normalizeBatteryIds(s.setup, s.type)[batterySlotFocus] ?? null;
          return (
            <>
              {curAtPillar != null ? (
                <p className="mb-3 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  {pillarDrained
                    ? 'Pillar drained. You can remove or swap packs. After mounting, recharge fills charge (no free implicit refill).'
                    : 'Drain this pillar to 0% runtime before removing or swapping (avoids losing partial charge).'}
                </p>
              ) : null}
              <ul className="space-y-2">
                {Object.values(MINECORE_BATTERIES).map((b) => {
                  const owned = props.minecoreState.owned.batteries[b.id] ?? 0;
                  const isInstalled = s.setup.batteryIds[batterySlotFocus] === b.id;
                  const canPick = canAssignBatteryToPlantSlot(
                    props.minecoreState.plantSlots,
                    props.slotArrayIndex,
                    batterySlotFocus,
                    b.id,
                    owned,
                  );
                  const wouldSwap = curAtPillar != null && b.id !== curAtPillar;
                  const chargeLocksSwap = wouldSwap && !pillarDrained;
                  const invBlocked = !canPick && !isInstalled;
                  const rowBlocked = invBlocked || chargeLocksSwap;
                  return (
                    <li key={b.id} className="list-none">
                      <ModalPartRow
                        title={b.label}
                        subtitle={`Runtime ${formatDuration(b.chargeCapacityMs)} stored (catalog) · max per slot uses rig charge budget + worker battery bonus.`}
                        owned={owned}
                        inUse={displayAssignedCount(countBatteriesAssigned(props.minecoreState.plantSlots, b.id), owned)}
                        disabled={rowBlocked}
                        disabledHint={
                          chargeLocksSwap
                            ? 'Drain this pillar to 0% before swapping packs.'
                            : invBlocked
                              ? owned <= 0
                                ? 'Craft this pack in Fabrication - none owned.'
                                : 'Every owned pack of this type is already assigned (inventory limits).'
                              : undefined
                        }
                        selected={isInstalled}
                        onClick={() => {
                          if (isInstalled) {
                            setModalFeedback('This pack is already in this slot.');
                            return;
                          }
                          if (curAtPillar == null) {
                            setBatteryInstallConfirmId(b.id);
                            return;
                          }
                          dispatchInstallPartPayload({
                            kind: 'battery',
                            id: b.id,
                            batterySlotIndex: batterySlotFocus,
                          });
                          setActiveModal(null);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
              {s.setup.batteryIds?.[batterySlotFocus] ? (
                <ModalActionRow
                  title="Remove battery from this slot"
                  subtitle={
                    pillarDrained
                      ? 'Returns pack to inventory; mounting again starts empty until you recharge.'
                      : 'Drain this pillar to 0% runtime before removing this pack.'
                  }
                  destructive
                  disabled={!pillarDrained}
                  onClick={() => setBatteryRemoveConfirmOpen(true)}
                />
              ) : null}
            </>
          );
        })()}
      </SelectionModal>

      {batteryInstallConfirmId != null && typeof window !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              role="presentation"
              onClick={() => setBatteryInstallConfirmId(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="battery-install-confirm-title"
                className="max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 id="battery-install-confirm-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Install battery pack?
                </h4>
                <p className="mt-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  After you install it on this pillar, you cannot change the pack model until this pillar is fully empty (0%
                  runtime left).
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBatteryInstallConfirmId(null)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatchInstallPartPayload({
                        kind: 'battery',
                        id: batteryInstallConfirmId,
                        batterySlotIndex: batterySlotFocus,
                      });
                      setBatteryInstallConfirmId(null);
                      setActiveModal(null);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {batteryRemoveConfirmOpen && typeof window !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              role="presentation"
              onClick={() => setBatteryRemoveConfirmOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="battery-remove-confirm-title"
                className="max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 id="battery-remove-confirm-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Remove battery pack?
                </h4>
                <p className="mt-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  Removing it clears stored runtime on this pillar (the tank goes empty). You will need to refill before you can
                  mine from this slot again.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBatteryRemoveConfirmOpen(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatchInstallPartPayload({
                        kind: 'battery',
                        id: null,
                        batterySlotIndex: batterySlotFocus,
                      });
                      setBatteryRemoveConfirmOpen(false);
                      setActiveModal(null);
                    }}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <SelectionModal
        isOpen={activeModal === 'worker'}
        onClose={() => setActiveModal(null)}
        title="Assign crew"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            {modalFeedback}
          </p>
        ) : null}
        {crewPlantUndersized ? (
          <WarningBanner
            level="warn"
            message={`${machineConfig?.label ?? 'This rig'} needs ${rigCrewNeed} staffed crew links; ${MINECORE_PLANT_PRESETS[s.type ?? 'standard'].label} supports ${needWorkers}. Upgrade the plant or swap rigs.`}
          />
        ) : null}
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Tap rows to toggle selection, like Modules. You can pick up to {needWorkers} distinct Crew-tab NFT deck row
          {needWorkers === 1 ? '' : 's'} for this plant.
          {machineConfig ? (
            <>
              {' '}
              Your rig ({machineConfig.label}) needs at least {rigCrewNeed} staffed link{rigCrewNeed === 1 ? '' : 's'} before mining can start.
            </>
          ) : null}{' '}
          Rows that are empty or already linked to another plant are disabled.
        </p>
        <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">Crew tab roster</div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {MINECORE_NFT_CREW_ROLES_ORDER.map((role) => {
              const { filled, capacity } = nftTabSlotDeployments(nftStaffSlots, role);
              return (
                <div key={role} className="flex justify-between gap-2 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                  <span>{nftDeckRoleLabel(role)}</span>
                  <span>
                    {filled}/{capacity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ul className="space-y-2">
          {miningDeckRows.map(({ slot: deckSlot, deckIdx }) => {
            const deployed = deckSlot.nftId != null && deckSlot.collection;
            const padded = (() => {
              const raw = [...normalizePlantSetup(s.type, s.setup).workerNftDeckSlotIndices];
              while (raw.length < needWorkers) raw.push(null);
              return raw.slice(0, needWorkers);
            })();
            const assignedOnPlant = padded.includes(deckIdx);
            const filledCount = padded.filter((x) => x != null).length;
            const usedElsewhere = countWorkerNftDeckAssignmentsExcept(
              props.minecoreState.plantSlots,
              deckIdx,
              props.slotArrayIndex,
            );
            const rowBlockedOtherPlant = !deployed || (!assignedOnPlant && usedElsewhere >= 1);

            let crewAddBlocked = false;
            if (!assignedOnPlant && !rowBlockedOtherPlant) {
              if (filledCount >= needWorkers) crewAddBlocked = true;
              else {
                const fi = padded.indexOf(null);
                const nextIds =
                  fi >= 0
                    ? padded.map((x, i) => (i === fi ? deckIdx : x))
                    : padded;
                crewAddBlocked = !inventoryAllowsPlantSetup(props.minecoreState, props.slotArrayIndex, {
                  ...s.setup,
                  workerNftDeckSlotIndices: nextIds,
                });
              }
            }

            const rowBlocked = rowBlockedOtherPlant || crewAddBlocked;
            const meta = ctx?.nftMetadataByDeckIndex?.[deckIdx] ?? null;
            const perk = minecoreDeckBenefits(deckSlot, meta);
            const roleHint =
              deckSlot.type === 'foreman'
                ? ' · qualifies this plant for AUTO when staffed here'
                : deckSlot.type === 'operator'
                  ? ' · operator-grade roster slot'
                  : '';
            const subtitle = deployed
              ? `${nftDeckRoleLabel(deckSlot.type)} · Crew row #${deckIdx + 1} · NFT #${deckSlot.nftId} · +${perk.capBonus.toLocaleString()} rolling cap D/24h${roleHint}`
              : `Empty - deploy an NFT on the Crew tab for this row.`;
            return (
              <li key={deckIdx} className="list-none">
                <ModalPartRow
                  title={`${nftDeckRoleLabel(deckSlot.type)} #${deckIdx + 1}`}
                  subtitle={subtitle}
                  owned={deployed ? 1 : 0}
                  inUse={usedElsewhere}
                  disabled={Boolean(rowBlocked)}
                  disabledHint={
                    rowBlockedOtherPlant
                      ? !deployed
                        ? 'Put an NFT in this Crew-tab row first.'
                        : 'Another plant already uses this Crew-tab NFT row. Unlink there or choose a different row.'
                      : crewAddBlocked
                        ? filledCount >= needWorkers
                          ? `This plant only supports ${needWorkers} crew link${needWorkers === 1 ? '' : 's'}. Toggle one off to add another.`
                          : explainPlantSetupBlock(props.minecoreState, props.slotArrayIndex, {
                              ...s.setup,
                              workerNftDeckSlotIndices: (() => {
                                const fi = padded.indexOf(null);
                                return fi >= 0
                                  ? padded.map((x, i) => (i === fi ? deckIdx : x))
                                  : padded;
                              })(),
                            }) ?? 'Cannot assign this crew link.'
                        : undefined
                  }
                  selected={assignedOnPlant}
                  onClick={() => {
                    if (rowBlockedOtherPlant) return;
                    setModalFeedback(null);
                    if (assignedOnPlant) {
                      const next = padded.map((x) => (x === deckIdx ? null : x));
                      assignCrewIfChanged(next);
                      return;
                    }
                    if (crewAddBlocked) {
                      setModalFeedback(
                        filledCount >= needWorkers
                          ? `This plant only supports ${needWorkers} crew links. Toggle one off first.`
                          : explainPlantSetupBlock(props.minecoreState, props.slotArrayIndex, {
                              ...s.setup,
                              workerNftDeckSlotIndices: (() => {
                                const fi = padded.indexOf(null);
                                return fi >= 0
                                  ? padded.map((x, i) => (i === fi ? deckIdx : x))
                                  : padded;
                              })(),
                            }) ?? 'Cannot add this crew link.',
                      );
                      return;
                    }
                    const fi = padded.indexOf(null);
                    if (fi < 0) return;
                    const next = padded.map((x, i) => (i === fi ? deckIdx : x));
                    assignCrewIfChanged(next);
                  }}
                  trailing={
                    assignedOnPlant ? (
                      <Icons.Check className="h-5 w-5 shrink-0 self-center text-emerald-600 dark:text-emerald-400" />
                    ) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
        <ModalActionRow
          title="Clear all crew links on this plant"
          subtitle="Clears every crew selection for this plant."
          destructive
          disabled={normalizePlantSetup(s.type, s.setup).workerNftDeckSlotIndices.every((x) => x == null)}
          onClick={() => {
            assignCrewIfChanged(Array.from({ length: needWorkers }, () => null));
          }}
        />
      </SelectionModal>
      <SelectionModal
        isOpen={activeModal === 'modules'}
        onClose={() => setActiveModal(null)}
        title="Install Modules"
      >
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Tap a row to toggle. Higher plant tiers allow more module slots.
        </p>
        <ul className="space-y-2">
          {(Object.values(MINECORE_MODULES) as ModuleConfig[]).map((m) => {
            const owned = props.minecoreState.owned.modules[m.id as MinecoreModuleId] ?? 0;
            const inUse = displayAssignedCount(
              countModuleAssignments(props.minecoreState.plantSlots, m.id as MinecoreModuleId),
              owned,
            );
            const isSelected = s.setup.moduleIds.includes(m.id as MinecoreModuleId);
            const maxM = MINECORE_MAX_MODULES_BY_PLANT[s.type];
            const nextIfAdd = [...s.setup.moduleIds, m.id as MinecoreModuleId].slice(0, maxM);
            const moduleAddBlocked =
              !isSelected &&
              !inventoryAllowsPlantSetup(props.minecoreState, props.slotArrayIndex, { ...s.setup, moduleIds: nextIfAdd });
            const flatCap = m.diamondsPer24hFlat ?? 0;
            const powerBits: string[] = [];
            if (m.kind === 'cooling') {
              if ((m.consumptionReduction ?? 0) > 0) powerBits.push('Less grid draw');
              if ((m.failureReduction ?? 0) > 0) powerBits.push('Less wear strain');
            } else if ((m.failureReduction ?? 0) > 0) {
              powerBits.push('Less wear strain');
            }
            const specParts = [
              flatCap > 0 ? `+${flatCap} D/24h cap` : '',
              m.kind === 'output' && flatCap <= 0 && (m.outputBonus ?? 0) > 0
                ? `+${(m.outputBonus * 100).toFixed(0)}% extraction`
                : '',
              powerBits.length > 0 ? powerBits.join(' · ') : '',
              m.kind === 'automation' ? `+${((m.cycleDurationBonus ?? 0) * 100).toFixed(0)}% cycle` : '',
              m.kind === 'stability' ? `+${m.efficiencyFloorBonus ?? 0} eff. floor` : '',
              m.kind === 'refining' ? `+${((m.refineBonus ?? 0) * 100).toFixed(0)}% refine` : '',
            ].filter(Boolean);
            return (
              <li key={m.id} className="list-none">
                <ModalPartRow
                  title={m.label}
                  subtitle={specParts.join(' · ')}
                  owned={owned}
                  inUse={inUse}
                  disabled={moduleAddBlocked}
                  disabledHint={
                    moduleAddBlocked
                      ? owned <= 0
                        ? 'Craft this module in Fabrication - none owned.'
                        : 'Inventory limits - remove from another plant or craft another.'
                      : undefined
                  }
                  selected={isSelected}
                  onClick={() => {
                    if (moduleAddBlocked && !isSelected) return;
                    const current = s.setup.moduleIds;
                    const maxM = MINECORE_MAX_MODULES_BY_PLANT[s.type];
                    const next = current.includes(m.id as MinecoreModuleId)
                      ? current.filter((x) => x !== m.id)
                      : [...current, m.id as MinecoreModuleId].slice(0, maxM);
                    dispatchInstallPartPayload({ kind: 'modules', ids: next });
                  }}
                  trailing={isSelected ? <Icons.Check className="h-5 w-5 shrink-0 self-center text-emerald-600 dark:text-emerald-400" /> : undefined}
                />
              </li>
            );
          })}
        </ul>
        {MINECORE_MAX_MODULES_BY_PLANT[s.type] > 0 && s.setup.moduleIds.length > 0 ? (
          <ModalActionRow
            title="Clear all modules"
            subtitle="Unequips every module from this plant."
            destructive
            onClick={() => {
              dispatchInstallPartPayload({ kind: 'modules', ids: [] });
              setActiveModal(null);
            }}
          />
        ) : null}
      </SelectionModal>
    </>
  );
}
