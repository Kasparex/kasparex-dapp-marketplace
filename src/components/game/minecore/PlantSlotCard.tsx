'use client';

import type { MinecoreState, PlantSlotState, MinecoreModuleId } from '@/lib/game/minecore';
import {
  computeLiveBatteryChargeMs,
  computePlantDailyCapProgress,
  computePlantReady,
  computeRollingDailyCapWindowRemainingMs,
  getBatteryCapacityMs,
  getPowerUnitCap,
  computeBatteryRuntimeMs,
  computeLiveBatterySlotChargeMs,
  computeFlowRatePerMin,
  minecorePlantHasForemanInCrew,
  minecoreAutoRestartInfrastructureActive,
} from '@/lib/game/minecore/compute';
import {
  computeConsumptionKw,
  computeEffectiveMiningEfficiencyPct,
  computeMaintenanceWearRatio,
  computeMiningEfficiencyPct,
  computePlantRollingDailyCapBreakdown,
  computeProductionKw,
  formatMinecorePowerDisplay,
  computePlantMiningSpeedMultiplier,
  type PlantRollingCapBreakdown,
} from '@/lib/game/minecore/plant-economy';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  canAssignBatteryToPlantSlot,
  countBatteriesAssigned,
  countMachinesAssigned,
  countMachinesAssignedExcept,
  countPowerNodesAssigned,
  countPowerNodesAssignedExcept,
  countModuleAssignments,
  countWorkerNftDeckAssignmentsExcept,
  displayAssignedCount,
  inventoryAllowsPlantSetup,
  MINECORE_NFT_CREW_ROLES_ORDER,
  nftDeckRoleLabel,
  nftTabSlotDeployments,
  normalizePlantSetup,
  plantNftSlotAssignmentValid,
} from '@/lib/game/minecore/asset-usage';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_POWER_NODES,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_KREX_PER_KAS,
  MINECORE_KW_SCALE,
  MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR,
  MINECORE_PLANT_REPAIR_KAS,
  miningWorkerNftSlotsRequired,
  type ModuleConfig,
} from '@/lib/game/minecore/config';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import {
  getPlantBatterySlotCount,
  hasInstalledBattery,
  getMaxChargePerSlotMs,
  normalizeBatteryIds,
  ensureBatterySlotChargeLength,
} from '@/lib/game/minecore/battery-utils';
import { computeMinecoreBatteryBonusMsPerSlot } from '@/lib/game/minecore/nft-deck-benefits';
import { describePlantWorkerAssignments } from '@/lib/game/minecore/plant-worker-display';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(n: number) {
  return n <= 0 ? 0 : n >= 1 ? 1 : n;
}

/** Show auxiliary Recharge CTA only when charge is below this fraction of capacity. */
const BATTERY_LOW_RECHARGE_THRESHOLD = 0.35;

const MINING_ASSIGNABLE_TYPES = ['worker', 'operator', 'foreman'] as const;

/** Rolling-cap contributions (diamonds / 24h toward cap) */
const CAP_CONTRIB_BADGE_CLS =
  'rounded-full border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-emerald-800 dark:text-emerald-300';
/** Crew NFT runtime bonus + slot max runtime (same sky capsule family) */
const BATTERY_SKY_BADGE_CLS =
  'rounded-full border border-sky-500/35 bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-sky-800 dark:text-sky-300';

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

function statusBadge(status: PlantSlotState['status']) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide';
  if (status === 'MiningActive')    return `${base} border border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300`;
  if (status === 'MiningPaused')    return `${base} border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300`;
  if (status === 'CreditingReady') return `${base} border border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-300`;
  if (status === 'ReadyToMine')     return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300`;
  if (status === 'SetupIncomplete') return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300`;
  if (status === 'BatteryEmpty')    return `${base} border border-orange-500/30 bg-orange-500/15 text-orange-800 dark:text-orange-300`;
  if (status === 'InsufficientPower') return `${base} border border-orange-500/35 bg-orange-500/15 text-orange-900 dark:text-orange-200`;
  if (status === 'DailyCapReached') return `${base} border border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-200`;
  if (status === 'NeedsPower' || status === 'NeedsRepair') return `${base} border border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300`;
  return `${base} border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
}

function efficiencyBadgeClassName() {
  return 'inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300';
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

function tooltipForStatus(status: PlantSlotState['status']): string {
  switch (status) {
    case 'EmptySlot':
      return 'This slot has no unlocked plant yet.';
    case 'SetupIncomplete':
      return 'Finish setup: machine, batteries, crew, and power as required.';
    case 'ReadyToMine':
      return 'Plant is ready - start a mining run when you are set.';
    case 'MiningActive':
      return 'Mining is running; diamonds accrue until you stop, hit cap, or the battery empties.';
    case 'MiningPaused':
      return 'Run is paused - no new diamonds and no battery drain until you resume.';
    case 'BatteryEmpty':
      return 'Battery charge is empty - recharge to mine again.';
    case 'CreditingReady':
      return 'Cycle finished - extract or bank accrued diamonds.';
    case 'NeedsRepair':
      return 'Maintenance required - repair before normal mining.';
    case 'NeedsPower':
      return 'Needs sufficient grid power or charged batteries to start.';
    case 'InsufficientPower':
      return 'Total draw exceeds what this plant can supply - adjust rigs, reactors, or batteries.';
    case 'DailyCapReached':
      return 'Rolling 24h diamond cap reached for this plant; try again after the reset window.';
    default:
      return 'Plant status.';
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
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const statCls =
    props.statTone === 'rose'
      ? 'text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
      : 'text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded';
  const interactive = Boolean(props.onClick) && !props.disabled;
  const rowCls = `flex w-full items-center gap-2 py-2 px-2 rounded-lg transition-colors group text-left font-sans ${
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

/** Daily cap: rolling 24h from plant activation; visible cap reset timer + progress bar. */
function DailyCapBar(props: {
  mined: number;
  cap: number;
  ratio: number;
  /** When setup incomplete - show 0/0 and empty progress (counters still visible). */
  forceZeroDisplay: boolean;
  capReached: boolean;
  remainingMs: number;
  capStack?: PlantRollingCapBreakdown;
}) {
  const r = clamp01(props.ratio);
  const showCountdown = props.remainingMs > 0;
  const displayMined = props.forceZeroDisplay ? 0 : Math.floor(props.mined);
  const displayCap = props.forceZeroDisplay ? 0 : Math.max(0, Math.floor(props.cap));

  const capStackHint =
    props.capStack != null && !props.forceZeroDisplay
      ? (() => {
          const cs = props.capStack;
          let line = `Cap stack: Plant +${cs.plantBase} · Rig +${cs.machineCap} · Crew +${cs.crewCap} = ${cs.subtotal} base /24h`;
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
    <Tooltip content="Time left until this plant’s 24h diamond budget resets.">
      <span
        className={`font-mono text-lg font-black tabular-nums tracking-tight sm:text-xl ${
          props.forceZeroDisplay ? 'text-zinc-500 dark:text-zinc-500' : 'text-sky-600 dark:text-sky-300'
        }`}
      >
        {formatCapResetCountdown(props.remainingMs)}
      </span>
    </Tooltip>
  ) : null;

  const counterBlock = (
    <Tooltip
      content={
        props.forceZeroDisplay
          ? 'Complete setup to see your rolling cap and mined total.'
          : capStackHint
            ? `Mined this 24h window vs your cap.\n${capStackHint}`
            : 'Mined this 24h window vs your cap.'
      }
    >
      <span className="inline-flex flex-wrap items-baseline justify-end gap-x-0 text-lg font-black tabular-nums tracking-tight sm:text-xl cursor-help">
        <span className="text-amber-400 dark:text-amber-300">{displayMined.toLocaleString()}</span>
        <span className="px-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">of</span>
        <span className="text-emerald-600 dark:text-emerald-400">{displayCap.toLocaleString()}</span>
        <span className="pl-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400">/ 24h</span>
      </span>
    </Tooltip>
  );

  const progressBlock =
    props.forceZeroDisplay ? null : (
      <Tooltip content="Share of this plant’s 24h diamond budget already used.">
        <div className="h-2.5 w-full cursor-help overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-[width] duration-700 dark:bg-amber-400"
            style={{ width: `${Math.max(2, Math.round(r * 100))}%` }}
          />
        </div>
      </Tooltip>
    );

  const capReachedBlock =
    !props.forceZeroDisplay && props.capReached ? (
      <Tooltip content="Wait for the timer to start a new 24h window, or refine diamonds in Redeem.">
        <div className="cursor-help text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          Rolling 24h cap reached for this plant. Refine in Redeem, or wait for the next window.
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
    ? 'border-amber-500 bg-amber-500/5 dark:border-amber-500/60'
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
          <span className="font-mono text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{props.inUse}</span>
        </div>
        {props.trailing ?? <Icons.ChevronRight className="h-5 w-5 shrink-0 self-center text-zinc-300 dark:text-zinc-600" />}
      </div>
    </button>
  );
  if (props.disabled && props.disabledHint) {
    return (
      <Tooltip content={props.disabledHint}>
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

/** Consumption vs max-power sharing one track; Balance label uses surplus kW story. */
function PowerGridBalanceBar(props: { prodKw: number; consKw: number; balKw: number; effGridPct: number }) {
  const sum = props.prodKw + props.consKw;
  const denom = sum > 1e-9 ? sum : 1;
  const consFrac = clamp01(props.consKw / denom);
  const prodFrac = clamp01(props.prodKw / denom);
  const inner = (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-mono text-[10px] text-zinc-700 dark:text-zinc-200">
        <Tooltip content="Power drawn by the rig and modules on this plant.">
          <span className="cursor-help text-rose-600 dark:text-rose-400">
            Consumption {formatMinecorePowerDisplay(props.consKw)}
          </span>
        </Tooltip>
        <Tooltip content="Max power this plant can supply: tier base, rig bus, optional reactor.">
          <span className="cursor-help text-emerald-600 dark:text-emerald-400">
            Max power {formatMinecorePowerDisplay(props.prodKw)}
          </span>
        </Tooltip>
      </div>
      <Tooltip content="Demand (rose) vs max supply (green) on the same scale.">
        <div className="h-2.5 w-full cursor-help overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="flex h-full w-full">
            <div
              className="h-full flex-none bg-rose-500 transition-[width] duration-500"
              style={{ width: `${consFrac * 100}%` }}
            />
            <div
              className="h-full flex-none bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${prodFrac * 100}%` }}
            />
          </div>
        </div>
      </Tooltip>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold">
        <Tooltip content="Max power minus consumption - headroom for efficiency.">
          <span
            className={`cursor-help ${props.balKw >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}
          >
            Balance {props.balKw >= 0 ? '+' : '−'}
            {formatMinecorePowerDisplay(Math.abs(props.balKw))}
          </span>
        </Tooltip>
        <Tooltip content="Nominal grid efficiency before maintenance wear.">
          <span className="cursor-help text-zinc-600 dark:text-zinc-300">Grid eff {props.effGridPct.toFixed(0)}%</span>
        </Tooltip>
      </div>
    </div>
  );
  return inner;
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
}) {
  const miningLeftMs = Math.max(0, props.miningLeftMs);
  const miningMaxMs = Math.max(0, props.miningMaxMs);
  const miningFrac = miningMaxMs > 1e-6 ? clamp01(miningLeftMs / miningMaxMs) : 0;
  const hasPackStats = miningMaxMs > 0;
  const miningLabel =
    miningLeftMs > 0 ? formatDuration(miningLeftMs) : props.liveChargeMs <= 0 && props.capacityMs > 0 ? 'Empty' : '-';

  return (
    <div className="space-y-1.5 rounded-xl border border-zinc-100 bg-white/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="flex items-start justify-between gap-2">
        <Tooltip content="Stored energy remaining for this run - same nominal clock as the tanks below.">
          <span className="cursor-help text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Energy · mining runtime
          </span>
        </Tooltip>
        <span className="text-right text-xs font-black tabular-nums text-zinc-800 dark:text-zinc-100">{miningLabel}</span>
      </div>
      {hasPackStats ? (
        <div className="space-y-1">
          <Tooltip content="Charge left versus a full pack; slots drain in order (1 → 2 …).">
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
          <Tooltip content="Total nominal charge remaining vs installed pack ceiling.">
            <p className="cursor-help text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              Nominal charge{' '}
              <span className="font-mono font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
                {props.liveChargeMs > 0 ? formatDuration(props.liveChargeMs) : '0'}
              </span>
              {' / '}
              <span className="font-mono font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
                {formatDuration(props.capacityMs)}
              </span>
            </p>
          </Tooltip>
        </div>
      ) : null}
      <div className="flex items-end justify-center gap-2 pt-0.5">
        {props.maxSlotMs.map((max, i) => {
          const live = props.liveSlotMs[i] ?? 0;
          const installed = max > 0;
          const r = installed ? live / max : 0;
          const fillCls = tierBatteryFillCls(r);
          const slotRuntimeLabel = installed ? formatShortBatterySlotRuntime(live) : '-';
          return (
            <Tooltip
              key={i}
              content={
                installed
                  ? `Slot ${i + 1}: ${formatShortBatterySlotRuntime(live)} left of ${formatShortBatterySlotRuntime(max)} nominal. Earlier slots drain first.`
                  : 'Empty slot - tap to assign a battery.'
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

/** Distinct from battery tier - violet maintenance health (inverse wear). */
function MaintenanceWearBar(props: { wearRatio: number; onOpen?: () => void }) {
  const health = clamp01(1 - props.wearRatio);
  const inner = (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Maintenance</span>
        <span className="text-xs font-black tabular-nums text-violet-600 dark:text-violet-400">{Math.round(health * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-violet-500 transition-[width] duration-700"
          style={{ width: `${Math.max(2, Math.round(health * 100))}%` }}
        />
      </div>
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
  return (
    <Tooltip content="Efficiency drops as systems age. Tap for service options. Plant tier stretches the interval.">
      {trigger}
    </Tooltip>
  );
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
  /** Refill battery charge: KAS via treasury send; KREX via L1 KRC-20 transfer (real wallet payment). */
  onRechargePlant: (opts?: {
    batterySlotIndex?: number;
    batterySlotIndexes?: number[];
    currency?: 'KAS' | 'KREX';
  }) => void | Promise<void>;
  onStopMining: () => void;
  onResumeMining: () => void;
  onInstallPart: (kind: any, id: any, batterySlotIndex?: number, workerSlotPosition?: number) => void;
  onChangePlantType: (type: any, cost: number) => void;
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
  const autoRestartInfra = minecoreAutoRestartInfrastructureActive(props.minecoreState);

  const [activeModal, setActiveModal] = useState<'machine' | 'battery' | 'worker' | 'modules' | 'powerNode' | 'preset' | null>(null);
  const [batterySlotFocus, setBatterySlotFocus] = useState(0);
  const [batteryRefillModalOpen, setBatteryRefillModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [refillSlotIndexes, setRefillSlotIndexes] = useState<number[]>([]);
  const [refillPayCurrency, setRefillPayCurrency] = useState<'KAS' | 'KREX'>('KAS');
  const [repairPayCurrency, setRepairPayCurrency] = useState<'KAS' | 'KREX'>('KAS');
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (batteryRefillModalOpen) setRefillPayCurrency('KAS');
  }, [batteryRefillModalOpen]);

  useEffect(() => {
    if (maintenanceModalOpen) setRepairPayCurrency('KAS');
  }, [maintenanceModalOpen]);

  useEffect(() => {
    setModalFeedback(null);
  }, [activeModal]);

  // ── Live computed values ─────────────────────────────────────────────────
  const cycle = s.cycle;

  const liveChargeMs    = computeLiveBatteryChargeMs(s, now);
  const capacityMs      = getBatteryCapacityMs(s, props.minecoreState, ctx);
  const batteryRatio    = capacityMs > 0 ? liveChargeMs / capacityMs : 0;
  const batteryLow      = batteryRatio < 0.2 && batteryRatio > 0;
  const batteryEmpty    = liveChargeMs <= 0 && cycle != null;
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
  const nodeConfig      = s.setup.powerNodeId ? MINECORE_POWER_NODES[s.setup.powerNodeId] : null;
  const powerUnitCount  = getPlantBatterySlotCount(s.type);
  const installedBatteryIndices = useMemo(() => {
    const ids = normalizeBatteryIds(s.setup, s.type);
    return ids.map((id, i) => (id ? i : null)).filter((x): x is number => x != null);
  }, [s.setup, s.type]);
  const setupReady = computePlantReady(props.minecoreState, s);

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
  let workerFilled = 0;
  for (let i = 0; i < needWorkers; i++) {
    if (workerIndices[i] != null) workerFilled++;
  }

  const workerSetupDisplay = useMemo(
    () => describePlantWorkerAssignments(props.minecoreState, s, ctx),
    [props.minecoreState, s, ctx],
  );
  const workerSetupValue = useMemo(() => {
    const { summary } = workerSetupDisplay;
    if (workerFilled === 0) return `${workerFilled}/${needWorkers}`;
    if (workerFilled < needWorkers) return `${workerFilled}/${needWorkers} · ${summary || '-'}`;
    return summary || `${workerFilled}/${needWorkers}`;
  }, [workerSetupDisplay, workerFilled, needWorkers]);
  const liveSlotChargesRaw = s.unlocked ? computeLiveBatterySlotChargeMs(s, now) : [];
  const nftBattBonusMs = computeMinecoreBatteryBonusMsPerSlot(props.minecoreState, ctx);
  const maxSlotChargesRaw = s.unlocked ? getMaxChargePerSlotMs(s.setup, s.type, nftBattBonusMs) : [];
  const liveSlotCharges = s.unlocked ? ensureBatterySlotChargeLength(liveSlotChargesRaw, powerUnitCount, 0) : [];
  const maxSlotCharges = s.unlocked ? ensureBatterySlotChargeLength(maxSlotChargesRaw, powerUnitCount, 0) : [];

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

  let actionLabel: string;
  if (!s.unlocked) {
    actionLabel = `Activate ${s.unlockCostKas.toLocaleString()} KAS`;
  } else if (s.status === 'SetupIncomplete') {
    actionLabel = 'Complete setup';
  } else if (s.status === 'NeedsRepair') {
    actionLabel = `Repair - ${MINECORE_PLANT_REPAIR_KAS} KAS`;
  } else if (batteryDeadInRun || s.status === 'NeedsPower') {
    actionLabel = `Refill battery - ${MINECORE_PLANT_RECHARGE_COST_KAS}+ KAS`;
  } else if (
    s.status === 'ReadyToMine' &&
    liveChargeMs <= 0 &&
    hasInstalledBattery(s.setup, s.type) &&
    s.setup.machineId
  ) {
    actionLabel = `Refill battery - ${MINECORE_PLANT_RECHARGE_COST_KAS}+ KAS`;
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
  const moduleBadgeCopy =
    s.type === 'standard' ? 'No modules' : s.type === 'premium' ? 'Premium modules' : 'Advanced modules';
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
          ? 'Click the plant image to open setup and upgrade the plant (tier, rig, crew, modules).'
          : undefined
      }
      mediaOverlayBottom={
        showFeaturedPlantArt && plantFeaturedUrl ? (
          <>
            <Tooltip
              content={`Base diamond budget for this plant tier (${preset.label}): ${baseCapDisplay} D/24h reference before rigs and modules.`}
            >
              <span className={statCapsuleCls}>{baseCapDisplay.toLocaleString()} Diamonds</span>
            </Tooltip>
            <Tooltip
              content={
                s.type === 'standard'
                  ? 'Standard plants do not mount premium/advanced modules.'
                  : s.type === 'premium'
                    ? 'Premium tier allows module slots for boosts (see Manage modules).'
                    : 'Advanced tier supports additional module slots and configurations.'
              }
            >
              <span className={`${statCapsuleCls} normal-case tracking-normal`}>{moduleBadgeCopy}</span>
            </Tooltip>
          </>
        ) : undefined
      }
      title={`Mining Plant ${props.slotArrayIndex + 1}`}
      titleAccessory={
        s.unlocked ? (
          <Tooltip content="Diamonds per minute right now (0 when not running).">
            <span className="inline-block font-mono text-sm font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-base">
              {(!setupReady ? 0 : Math.max(0, flowPerMin)).toFixed(1)} D/min
            </span>
          </Tooltip>
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
              capReached={dailyCap.cap24h > 0 && dailyCap.minedTowardCap >= dailyCap.cap24h}
              remainingMs={capRemainingMs}
              capStack={capBreakdown}
            />
          ) : null}

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content={tooltipForStatus(s.status)}>
              <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            </Tooltip>
            {s.unlocked && s.setup.machineId ? (
              <Tooltip content="Live mining efficiency from wear and how well power draw matches your plant budget. Higher is better.">
                <span className={`inline-flex ${efficiencyBadgeClassName()}`}>Eff {effDisplayPct.toFixed(0)}%</span>
              </Tooltip>
            ) : null}
            {s.unlocked &&
            s.setup.moduleIds.includes('krex-boost') &&
            (s.krexBoostUntilMs ?? 0) > 0 &&
            now < (s.krexBoostUntilMs ?? 0) ? (
              <Tooltip content="KREX Boost is active: diamond yield is multiplied until this timer ends (module must stay equipped).">
                <span className="inline-flex items-center rounded-full border border-violet-500/35 bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-900 dark:text-violet-200">
                  KREX Boost
                </span>
              </Tooltip>
            ) : null}
            {s.unlocked &&
            (((s.kasOverclockDailyBonusUntilMs ?? 0) > 0 &&
              now < (s.kasOverclockDailyBonusUntilMs ?? 0)) ||
              (s.kasOverclockNextCycleExtraDiamonds ?? 0) > 0) ? (
              <Tooltip content="KAS Overclock: adds a temporary bonus to your rolling daily diamond cap and/or extra diamonds on the next completed cycle.">
                <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-900 dark:text-amber-200">
                  Overclock
                </span>
              </Tooltip>
            ) : null}
            {s.unlocked ? (
              !foremanInPlantCrew ? (
                <Tooltip content="Link a Foreman from your Workers deck to this plant's Crew row (Mining setup) to unlock per-plant AUTO. Workers or Operators alone do not unlock it.">
                  <span
                    className="inline-flex items-center rounded-full border border-zinc-300/40 bg-zinc-100/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-400 opacity-80 dark:border-zinc-600/50 dark:bg-zinc-800/50 dark:text-zinc-500"
                    aria-disabled
                  >
                    Auto · off
                  </span>
                </Tooltip>
              ) : (
                <Tooltip
                  content={
                    autoRestartInfra
                      ? 'Per-plant AUTO: when on, this plant starts another run after a cycle if batteries still hold charge. No paid refills from automation. Tap to toggle.'
                      : 'AUTO is saved per plant. Add Regen Coil (or keep Foreman staffed) so automation infra can chain cycles after you turn AUTO on.'
                  }
                >
                  <button
                    type="button"
                    onClick={() => props.onTogglePlantAutoRestartMining?.(!s.autoRestartMining)}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide transition-opacity ${
                      s.autoRestartMining
                        ? 'cursor-pointer border-sky-500/30 bg-sky-500/15 text-sky-800 hover:opacity-90 dark:text-sky-300'
                        : 'cursor-pointer border-zinc-400/35 bg-zinc-200/50 text-zinc-700 hover:opacity-90 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300'
                    }`}
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
            <UnifiedBatterySegmentsBar
              liveSlotMs={liveSlotCharges}
              maxSlotMs={maxSlotCharges}
              miningLeftMs={batteryRuntimeMs}
              miningMaxMs={miningMaxNominalMs}
              liveChargeMs={liveChargeMs}
              capacityMs={capacityMs}
              onSlotPress={(slotIdx, installed) => {
                if (!installed) {
                  setBatterySlotFocus(slotIdx);
                  setActiveModal('battery');
                } else {
                  openBatteryRefillModal(slotIdx);
                }
              }}
            />
          ) : null}

          {/* ── Setup checklist ── */}
          <div className="space-y-0.5 rounded-xl border border-zinc-100 bg-white/60 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="mb-1 px-2 pt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Setup</div>
            <div className="max-h-[220px] space-y-0.5 overflow-y-auto px-1 pr-2 custom-scrollbar">
            <CheckRow
              installed={plantNftSlotAssignmentValid(props.minecoreState, s)}
              label="Crew"
              value={workerSetupValue}
              badges={
                workerSetupDisplay.badges.length > 0
                  ? workerSetupDisplay.badges.map((b) => (
                      <span
                        key={b.key}
                        className={
                          b.key === 'foreman-auto'
                            ? 'rounded-full border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-900 dark:text-amber-200'
                            : CAP_CONTRIB_BADGE_CLS
                        }
                      >
                        {b.text}
                      </span>
                    ))
                  : undefined
              }
              tooltip="Crew NFTs from the Workers tab. One row per plant. Tap to link or change."
              onClick={() => setActiveModal('worker')}
              disabled={!canEditParts}
            />
            <CheckRow
              installed={!!s.setup.machineId}
              label="Machines"
              value={machineConfig?.label}
              badges={
                machineConfig ? (
                  <span className={CAP_CONTRIB_BADGE_CLS}>+{machineConfig.diamondsPer24h} D</span>
                ) : undefined
              }
              tooltip={
                machineConfig
                  ? `${machineConfig.label}: +${machineConfig.diamondsPer24h} D/24h rolling cap · ×${machineConfig.miningSpeedMultiplier.toFixed(2)} mining speed · ${formatMinecorePowerDisplay(machineConfig.powerConsumptionFactor * MINECORE_KW_SCALE)} grid draw. Tap to swap.`
                  : 'Mining rig for this plant. Tap to assign.'
              }
              onClick={() => setActiveModal('machine')}
              disabled={!canEditParts}
            />
            {s.type !== 'standard' ? (
              <CheckRow
                installed={s.setup.moduleIds.length > 0}
                label="Modules"
                value={
                  s.setup.moduleIds.length > 0
                    ? `${s.setup.moduleIds.length} equipped · tap to manage`
                    : 'None equipped · tap to add'
                }
                tooltip={s.type === 'premium' ? 'Premium: add or swap modules.' : 'Advanced: add or swap modules.'}
                onClick={() => setActiveModal('modules')}
                disabled={!canEditParts}
              />
            ) : null}
            <CheckRow
              installed={!!nodeConfig}
              label="Power"
              value={nodeConfig?.label ?? 'Optional - tap to add a reactor'}
              badges={
                nodeConfig ? (
                  <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-amber-900 dark:text-amber-200">
                    +{nodeConfig.maxPowerKw} kW max
                  </span>
                ) : undefined
              }
              tooltip={
                nodeConfig
                  ? `Reactor installed: +${nodeConfig.maxPowerKw} kW to this plant’s max power. Tap to swap or remove.`
                  : 'Optional reactor crafted in Build - raises max plant power (kW). Tap to pick.'
              }
              onClick={() => setActiveModal('powerNode')}
              disabled={!canEditParts}
            />
            {Array.from({ length: powerUnitCount }, (_, bi) => {
              const bid = s.setup.batteryIds[bi] ?? null;
              const bcfg = bid ? MINECORE_BATTERIES[bid] : null;
              const maxEff = maxSlotCharges[bi] ?? 0;
              const deckBonusMin = nftBattBonusMs > 0 ? Math.max(1, Math.round(nftBattBonusMs / 60_000)) : 0;
              return (
                <CheckRow
                  key={bi}
                  installed={!!bid}
                  label={powerUnitCount > 1 ? `Battery ${bi + 1}` : 'Battery'}
                  value={bcfg?.label}
                  badges={
                    bid ? (
                      <>
                        {deckBonusMin > 0 ? (
                          <span className={BATTERY_SKY_BADGE_CLS} title="Bonus minutes added to every filled slot from Workers-tab NFTs.">
                            +{deckBonusMin}m crew NFT
                          </span>
                        ) : null}
                        {maxEff > 0 ? (
                          <span className={BATTERY_SKY_BADGE_CLS}>{formatShortBatterySlotRuntime(maxEff)} max</span>
                        ) : null}
                      </>
                    ) : undefined
                  }
                  tooltip={
                    bcfg
                      ? 'Stored energy for mining runs. Tap to swap or recharge.'
                      : 'Assign a battery pack. Tap to pick.'
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
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Power grid
              </div>
              <PowerGridBalanceBar prodKw={prodKw} consKw={consKw} balKw={balKw} effGridPct={effGridPct} />
            </div>
          ) : null}

          {s.unlocked ? (
            <MaintenanceWearBar wearRatio={wearRatio} onOpen={() => setMaintenanceModalOpen(true)} />
          ) : null}

          {/* ── Status warnings (above primary action) ── */}
          <div className="space-y-2">
            {s.status === 'DailyCapReached' && (
              <WarningBanner
                level="warn"
                message="Daily diamond budget hit for this plant. Refine or wait for the timer - press Start when you’re ready."
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
                message={`Low battery - ~${formatDuration(batteryRuntimeMs)} runtime left. Recharge before it dies.`}
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
            const n = refillSlotIndexes.length;
            const listKas = MINECORE_PLANT_RECHARGE_COST_KAS * n;
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
          const canNormal = s.needsRepair || wearRatio >= 1 - 1e-6;
          const canEarly =
            patches > 0 &&
            wearRatio >= MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR - 1e-9 &&
            wearRatio < 1 - 1e-6;
          const canPay = canNormal || canEarly;
          const consumePatch = !canNormal && canEarly;
          const payKas = (props.getKasPriceAfterDiscount ?? ((x: number) => x))(MINECORE_PLANT_REPAIR_KAS);
          const payKrex = payKas * MINECORE_KREX_PER_KAS;
          return (
            <>
              <div className="mb-4 rounded-xl border border-zinc-100 bg-white/60 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/30">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Plant health </span>
                <span className="tabular-nums text-violet-600 dark:text-violet-400">{healthPct}%</span>
                <span className="text-zinc-500 dark:text-zinc-400"> · Stability Patches: </span>
                <span className="font-bold tabular-nums text-zinc-800 dark:text-zinc-100">{patches}</span>
              </div>
              {!canPay ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Systems are within tolerance. After ~{Math.round(MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR * 100)}% wear you can spend a Stability Patch from the Shop to request early service, or wait for a hard maintenance lock.
                </p>
              ) : (
                <>
                  {consumePatch ? (
                    <p className="mb-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Uses 1 Stability Patch plus the standard service fee.
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <GameCurrencyMenu
                      ariaLabel="Maintenance payment currency"
                      value={repairPayCurrency}
                      onChange={(v) => setRepairPayCurrency(v as 'KAS' | 'KREX')}
                      options={[
                        {
                          value: 'KAS',
                          label: `${payKas.toLocaleString(undefined, { maximumFractionDigits: 6 })} KAS`,
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
                      className="k-cta-games h-11 min-w-[12rem] flex-[1.15] px-8 text-sm font-bold sm:min-w-[14rem]"
                      onClick={async () => {
                        const ok = await props.onRepairPlant({
                          currency: repairPayCurrency,
                          consumeStabilityPatch: consumePatch,
                        });
                        if (ok) setMaintenanceModalOpen(false);
                      }}
                    >
                      Pay & service
                    </button>
                  </div>
                </>
              )}
            </>
          );
        })()}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'preset'}
        onClose={() => setActiveModal(null)}
        title="Upgrade Plant"
      >
        <ul className="space-y-2">
          {Object.values(MINECORE_PLANT_PRESETS).map((p) => {
            const Icon = (Icons as any)[p.icon] ?? Icons.CircleDot;
            const isCurrent = s.type === p.type;
            const borderCls = isCurrent
              ? 'border-amber-500 bg-amber-500/5 dark:border-amber-500/60'
              : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600';
            return (
              <li key={p.type} className="list-none">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrent) props.onChangePlantType(p.type, p.costKas);
                    setActiveModal(null);
                  }}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${borderCls}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {p.featuredImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.featuredImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.label}</div>
                      <div className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{p.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                    <div className="flex min-w-[4rem] flex-col items-end">
                      <span className="text-[10px] font-semibold text-zinc-400">Upgrade</span>
                      <span className="font-mono text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
                        {p.costKas <= 0 ? '-' : `${p.costKas} KAS`}
                      </span>
                    </div>
                    <div className="flex min-w-[3.5rem] flex-col items-end">
                      <span className="text-[10px] font-semibold text-zinc-400">Status</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{isCurrent ? 'Current' : '-'}</span>
                    </div>
                    {isCurrent ? <Icons.Check className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" /> : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'machine'}
        onClose={() => setActiveModal(null)}
        title="Assign Machine"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100">
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
                    props.onInstallPart('machine', m.id);
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
            props.onInstallPart('machine', null);
            setActiveModal(null);
          }}
        />
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'powerNode'}
        onClose={() => setActiveModal(null)}
        title="Assign reactor"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100">
            {modalFeedback}
          </p>
        ) : null}
        <p className="mb-3 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          Reactors add max power (kW) at this plant. Craft them in Build. Optional - helps balance heavy rigs and modules.
        </p>
        <ul className="space-y-2">
          {Object.values(MINECORE_POWER_NODES).map((node) => {
            const owned = props.minecoreState.owned.nodes[node.id] ?? 0;
            const assignedElsewhere = countPowerNodesAssignedExcept(
              props.minecoreState.plantSlots,
              node.id,
              props.slotArrayIndex,
            );
            const canPick = assignedElsewhere + 1 <= owned;
            const isInstalled = s.setup.powerNodeId === node.id;
            const rowBlocked = !canPick && !isInstalled;
            return (
              <li key={node.id} className="list-none">
                <ModalPartRow
                  title={node.label}
                  subtitle={`+${node.maxPowerKw} kW max power · stacks with plant tier and rig bus`}
                  owned={owned}
                  inUse={displayAssignedCount(countPowerNodesAssigned(props.minecoreState.plantSlots, node.id), owned)}
                  disabled={rowBlocked}
                  disabledHint={
                    rowBlocked
                      ? owned <= 0
                        ? 'Craft this reactor in Build - none owned.'
                        : 'Every owned unit of this type is already on plants.'
                      : undefined
                  }
                  selected={isInstalled}
                  onClick={() => {
                    if (s.setup.powerNodeId === node.id) {
                      setActiveModal(null);
                      return;
                    }
                    props.onInstallPart('powerNode', node.id);
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <ModalActionRow
          title="Remove reactor"
          subtitle="Returns reactor to inventory."
          destructive
          disabled={!s.setup.powerNodeId}
          onClick={() => {
            props.onInstallPart('powerNode', null);
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
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100">
            {modalFeedback}
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
            const rowBlocked = !canPick && !isInstalled;
            return (
              <li key={b.id} className="list-none">
                <ModalPartRow
                  title={b.label}
                  subtitle={`Runtime ${formatDuration(b.chargeCapacityMs)} stored (catalog) · max per slot uses rig charge budget + worker battery bonus.`}
                  owned={owned}
                  inUse={displayAssignedCount(countBatteriesAssigned(props.minecoreState.plantSlots, b.id), owned)}
                  disabled={rowBlocked}
                  disabledHint={
                    rowBlocked
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
                    props.onInstallPart('battery', b.id, batterySlotFocus);
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
            subtitle="Returns pack to inventory; charge state resets for this slot."
            destructive
            onClick={() => {
              props.onInstallPart('battery', null, batterySlotFocus);
              setActiveModal(null);
            }}
          />
        ) : null}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'worker'}
        onClose={() => setActiveModal(null)}
        title="Assign mining NFT"
      >
        {modalFeedback ? (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100">
            {modalFeedback}
          </p>
        ) : null}
        <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">From the Workers tab</div>
          <p className="mt-1 leading-snug text-zinc-500 dark:text-zinc-400">
            Choose which Workers-tab NFT this plant uses - one NFT per plant. Rows that are empty or already linked to another plant are disabled below.
          </p>
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
            const assignedHere = normalizePlantSetup(s.type, s.setup).workerNftDeckSlotIndices[0] === deckIdx;
            const usedElsewhere = countWorkerNftDeckAssignmentsExcept(
              props.minecoreState.plantSlots,
              deckIdx,
              props.slotArrayIndex,
            );
            const rowBlocked = !deployed || (!assignedHere && usedElsewhere >= 1);
            const subtitle = deployed
              ? `${nftDeckRoleLabel(deckSlot.type)} · Workers slot #${deckIdx + 1} · NFT #${deckSlot.nftId}`
              : `Empty - assign an NFT on the Workers tab for this row.`;
            return (
              <li key={deckIdx} className="list-none">
                <ModalPartRow
                  title={`${nftDeckRoleLabel(deckSlot.type)} #${deckIdx + 1}`}
                  subtitle={subtitle}
                  owned={deployed ? 1 : 0}
                  inUse={usedElsewhere}
                  disabled={Boolean(rowBlocked)}
                  disabledHint={
                    rowBlocked
                      ? !deployed
                        ? 'Put an NFT in this Workers-tab row first.'
                        : 'Another plant already uses this Workers-tab NFT. Unlink there or choose a different row.'
                      : undefined
                  }
                  selected={assignedHere}
                  onClick={() => {
                    if (assignedHere) {
                      setActiveModal(null);
                      return;
                    }
                    props.onInstallPart('crewWorkerNftDeck', deckIdx, undefined, 0);
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <ModalActionRow
          title="Clear worker link for this plant"
          subtitle="Unlinks only this plant - the NFT stays on the Workers tab."
          destructive
          disabled={normalizePlantSetup(s.type, s.setup).workerNftDeckSlotIndices[0] == null}
          onClick={() => {
            props.onInstallPart('crewWorkerNftDeck', null, undefined, 0);
            setActiveModal(null);
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
            const specParts = [
              m.kind === 'output' ? `+${(m.outputBonus * 100).toFixed(0)}% extraction` : '',
              m.kind === 'cooling' ? `−${((m.consumptionReduction ?? 0) * 100).toFixed(0)}% kW` : '',
              m.kind === 'automation' ? `+${((m.cycleDurationBonus ?? 0) * 100).toFixed(0)}% cycle` : '',
              m.kind === 'stability' ? `+${m.efficiencyFloorBonus ?? 0} eff. floor` : '',
              m.kind === 'refining' ? `+${((m.refineBonus ?? 0) * 100).toFixed(0)}% refine` : '',
              `Fail −${(m.failureReduction * 100).toFixed(0)}%`,
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
                    props.onInstallPart('modules', next);
                  }}
                  trailing={isSelected ? <Icons.Check className="h-5 w-5 shrink-0 self-center text-amber-500 dark:text-amber-400" /> : undefined}
                />
              </li>
            );
          })}
        </ul>
        {s.type !== 'standard' && s.setup.moduleIds.length > 0 ? (
          <ModalActionRow
            title="Clear all modules"
            subtitle="Unequips every module from this plant."
            destructive
            onClick={() => {
              props.onInstallPart('modules', []);
              setActiveModal(null);
            }}
          />
        ) : null}
      </SelectionModal>
    </>
  );
}
