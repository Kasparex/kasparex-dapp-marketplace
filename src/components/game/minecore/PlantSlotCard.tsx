'use client';

import type { MinecoreState, PlantSlotState, MinecoreModuleId } from '@/lib/game/minecore';
import {
  computeLiveBatteryChargeMs,
  computePlantDailyCapProgress,
  computePlantReady,
  computeRollingDailyCapWindowRemainingMs,
  getBatteryCapacityMs,
  getPowerUnitCap,
  getPowerDrainScale,
} from '@/lib/game/minecore/compute';
import {
  computeConsumptionKw,
  computeMiningEfficiencyPct,
  computePlantDiamondsPer24h,
  computePowerBalanceKw,
  computeProductionKw,
} from '@/lib/game/minecore/plant-economy';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  canAssignBatteryToPlantSlot,
  countBatteriesAssigned,
  countMachinesAssigned,
  countMachinesAssignedExcept,
  countModuleAssignments,
  countWorkersAssigned,
  countWorkersAssignedExcept,
  displayAssignedCount,
  inventoryAllowsPlantSetup,
  nftTabSlotDeployments,
} from '@/lib/game/minecore/asset-usage';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_PLANT_BASE_DIAMONDS_PER_24H,
  MINECORE_PLANT_BASE_POWER_UNITS,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_KW_SCALE,
  MINECORE_PLANT_REPAIR_KAS,
  MINECORE_WORKERS,
  type ModuleConfig,
} from '@/lib/game/minecore/config';
import { getPlantBatterySlotCount, hasInstalledBattery } from '@/lib/game/minecore/battery-utils';
import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(n: number) {
  return n <= 0 ? 0 : n >= 1 ? 1 : n;
}

/** Show auxiliary Recharge CTA only when charge is below this fraction of capacity. */
const BATTERY_LOW_RECHARGE_THRESHOLD = 0.35;

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
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
  if (status === 'ExtractionReady') return `${base} border border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-300`;
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
  if (status === 'MiningActive')    return 'Mining active';
  if (status === 'MiningPaused')    return 'Paused';
  if (status === 'BatteryEmpty')    return 'Battery empty';
  if (status === 'ExtractionReady') return 'Run complete';
  if (status === 'NeedsRepair')     return 'Needs repair';
  if (status === 'NeedsPower')      return 'Needs power';
  if (status === 'InsufficientPower') return 'Grid deficit';
  if (status === 'DailyCapReached') return '24h cap';
  return status;
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
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const statCls =
    props.statTone === 'rose'
      ? 'text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
      : 'text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded';
  const interactive = Boolean(props.onClick) && !props.disabled;
  return (
    <Tooltip content={props.tooltip}>
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded-lg transition-colors group ${
          interactive ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer' : 'cursor-not-allowed opacity-55'
        }`}
        onClick={interactive ? props.onClick : undefined}
        aria-disabled={props.disabled || undefined}
      >
        <span className={`flex-shrink-0 text-sm font-black ${props.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {props.installed ? '✓' : '✗'}
        </span>
        <span className={`text-xs font-semibold max-w-[44%] flex-shrink-0 leading-tight sm:max-w-[40%] ${props.installed ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {props.label}
        </span>
        <span className={`text-xs truncate flex-1 font-medium ${props.installed ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600 italic'}`}>
          {props.value ?? 'Tap to assign…'}
        </span>
        {props.stat ? <span className={statCls}>{props.stat}</span> : null}
        {interactive ? (
          <Icons.ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        ) : null}
      </div>
    </Tooltip>
  );
}

/** Color-coded horizontal bar with label + value */
function ResourceBar(props: {
  label: string;
  value: string;
  ratio: number;
  variant: 'battery' | 'power' | 'cycle' | 'dailyCap';
  warning?: string | null;
  tooltip?: string;
}) {
  const r = clamp01(props.ratio);

  let barColor: string;
  if (props.variant === 'cycle' || props.variant === 'dailyCap') {
    barColor = 'bg-emerald-500';
  } else if (props.variant === 'battery') {
    if (r <= 0) barColor = 'bg-zinc-300 dark:bg-zinc-600';
    else if (r <= 0.2) barColor = 'bg-amber-500';
    else if (r <= 0.5) barColor = 'bg-sky-400';
    else barColor = 'bg-sky-500';
  } else {
    barColor = r > 0.4 ? 'bg-sky-500' : 'bg-rose-500';
  }

  const inner = (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{props.label}</span>
        <span className="text-xs font-black tabular-nums text-zinc-800 dark:text-zinc-100">{props.value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${barColor}`}
          style={{ width: `${Math.max(2, Math.round(r * 100))}%` }}
        />
      </div>
      {props.warning ? (
        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{props.warning}</div>
      ) : null}
    </div>
  );

  if (props.tooltip) {
    return <Tooltip content={props.tooltip}>{inner}</Tooltip>;
  }
  return inner;
}

/** Daily cap: rolling 24h from plant activation; countdown + progress bar. */
function DailyCapBar(props: {
  mined: number;
  cap: number;
  ratio: number;
  setupIncomplete: boolean;
  capReached: boolean;
  remainingMs: number;
}) {
  const r = clamp01(props.ratio);
  const showTimer = props.remainingMs > 0;
  const inner = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Cap resets in
        </span>
        {showTimer ? (
          <span className="font-mono text-lg font-black tabular-nums tracking-tight text-sky-600 dark:text-sky-400 sm:text-xl">
            {formatCapResetCountdown(props.remainingMs)}
          </span>
        ) : props.setupIncomplete || props.cap <= 0 ? (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">—</span>
        ) : (
          <span className="font-mono text-sm font-bold tabular-nums text-zinc-500 dark:text-zinc-400">—</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Mined / cap (window)</span>
        {props.setupIncomplete || props.cap <= 0 ? (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">—</span>
        ) : (
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-lg font-black text-amber-400 sm:text-xl dark:text-amber-300">
              {Math.floor(props.mined).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">/</span>
            <span className="text-lg font-black text-emerald-600 sm:text-xl dark:text-emerald-400">{props.cap.toLocaleString()}</span>
          </div>
        )}
      </div>
      {props.setupIncomplete || props.cap <= 0 ? (
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Complete machine, battery & worker to see your rolling daily cap.
        </p>
      ) : (
        <>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] duration-700 dark:bg-amber-400"
              style={{ width: `${Math.max(2, Math.round(r * 100))}%` }}
            />
          </div>
          {props.capReached ? (
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Rolling 24h cap reached for this plant. Refine in Redeem, or wait for the next window.
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  const tip =
    props.cap > 0 && !props.setupIncomplete
      ? `Each plant has its own rolling 24h diamond budget starting when you activate it (not global midnight). When the countdown hits zero, the window resets and your cap meter refreshes; you can mine again within that budget (auto-restart depends on your setup). Progress: ${Math.floor(props.mined).toLocaleString()} / ${props.cap.toLocaleString()} toward this window.`
      : 'Finish machine, battery, and worker setup to see your rolling cap and countdown.';

  return <Tooltip content={tip}>{inner}</Tooltip>;
}

/** Power-tab style row for setup modals. */
function ModalPartRow(props: {
  title: string;
  subtitle: string;
  owned: number;
  inUse: number;
  disabled?: boolean;
  selected?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  const borderCls = props.selected
    ? 'border-amber-500 bg-amber-500/5 dark:border-amber-500/60'
    : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600';
  return (
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
}

/**
 * One segment per power-unit (battery) slot. Blue ≈ that slice of the combined runtime still has charge; gray = depleted (V1 visual split of one pool).
 */
function BatteryUnitDots(props: { segments: number; chargeRatio: number }) {
  const n = Math.max(1, Math.min(props.segments, 10));
  const r = clamp01(props.chargeRatio);
  const blueCount = r <= 0 ? 0 : Math.min(n, Math.max(0, Math.round(r * n)));
  const inner = (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Battery slots</span>
        <span className="text-xs font-black tabular-nums text-zinc-800 dark:text-zinc-100">
          {r <= 0 ? '0' : `${(r * 100).toFixed(0)}%`} on-line
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-sm transition-colors ${
              i < blueCount ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
  return (
    <Tooltip
      content={`${n} power-unit slot(s) = how many battery packs you can run on this plant. One combined runtime bar above; these segments go gray as that shared charge is used up.`}
    >
      {inner}
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
  slot: PlantSlotState;
  now: number;
  onUnlock: () => void;
  onStart: () => void;
  onExtract: () => void;
  onRepairWithKAS: (args: { amountKas: number }) => void | Promise<void>;
  /** KAS: +1 (or more) reserve unit and full battery per purchase. */
  onRechargePlant: (opts?: { units?: number }) => void | Promise<void>;
  onStopMining: () => void;
  onResumeMining: () => void;
  onInstallPart: (kind: any, id: any, batterySlotIndex?: number) => void;
  onChangePlantType: (type: any, cost: number) => void;
}) {
  const s   = props.slot;
  const now = props.now;

  const [activeModal, setActiveModal] = useState<'machine' | 'battery' | 'worker' | 'modules' | 'preset' | null>(null);
  const [batterySlotFocus, setBatterySlotFocus] = useState(0);

  useEffect(() => {
    if (s.status === 'MiningActive' && activeModal) setActiveModal(null);
  }, [s.status, activeModal]);

  // ── Live computed values ─────────────────────────────────────────────────
  const cycle = s.cycle;

  const liveChargeMs    = computeLiveBatteryChargeMs(s, now);
  const capacityMs      = getBatteryCapacityMs(s);
  const batteryRatio    = capacityMs > 0 ? liveChargeMs / capacityMs : 0;
  const batteryLow      = batteryRatio < 0.2 && batteryRatio > 0;
  const batteryEmpty    = liveChargeMs <= 0 && cycle != null;
  /** Depleted mid-run (not paused): primary action should be Recharge, not duplicate with secondary button. */
  const batteryDeadInRun =
    s.status === 'BatteryEmpty' &&
    liveChargeMs <= 0 &&
    cycle != null &&
    cycle.pauseBeganAtMs == null;
  const batteryRuntimeMs = capacityMs > 0 && s.setup.machineId
    ? liveChargeMs / Math.max(0.05, getPowerDrainScale(s))
    : 0;

  const d24 = s.unlocked && computePlantReady(s) ? computePlantDiamondsPer24h(props.minecoreState, s) : 0;
  const dailyCap = computePlantDailyCapProgress(props.minecoreState, s, now);
  const capRemainingMs = s.unlocked ? computeRollingDailyCapWindowRemainingMs(s, now) : 0;
  const prodKw = s.unlocked ? computeProductionKw(s) : 0;
  const consKw = s.unlocked && s.setup.machineId ? computeConsumptionKw(s) : 0;
  const balKw = prodKw - consKw;
  const effPct = s.unlocked && s.setup.machineId ? computeMiningEfficiencyPct(s) : 100;

  // ── Config lookups ───────────────────────────────────────────────────────
  const machineConfig   = s.setup.machineId ? MINECORE_MACHINES[s.setup.machineId] : null;
  const workerConfig    = s.setup.workerId  ? MINECORE_WORKERS[s.setup.workerId]    : null;
  const powerUnitCount  = getPlantBatterySlotCount(s.type);
  const nftStaffSlots = props.minecoreState.nftSlots ?? [];
  const nftWorkerDeployed = nftTabSlotDeployments(nftStaffSlots, 'worker');
  const nftOperatorDeployed = nftTabSlotDeployments(nftStaffSlots, 'operator');
  const powerDotMax = Math.max(1, getPowerUnitCap(s));
  const capUnits = getPowerUnitCap(s);
  const atFullEnergy =
    hasInstalledBattery(s.setup, s.type) &&
    capacityMs > 0 &&
    liveChargeMs >= capacityMs - 1 &&
    s.powerRemaining >= capUnits;

  let actionLabel: string;
  if (!s.unlocked) {
    actionLabel = `Activate ${s.unlockCostKas.toLocaleString()} KAS`;
  } else if (s.status === 'SetupIncomplete') {
    actionLabel = 'Complete setup';
  } else if (s.status === 'NeedsRepair') {
    actionLabel = `Repair — ${MINECORE_PLANT_REPAIR_KAS} KAS`;
  } else if (batteryDeadInRun || s.status === 'NeedsPower') {
    actionLabel = `Recharge — ${MINECORE_PLANT_RECHARGE_COST_KAS} KAS`;
  } else if (s.status === 'InsufficientPower') {
    actionLabel = 'Improve power balance';
  } else if (s.status === 'DailyCapReached') {
    actionLabel = '24h cap reached';
  } else if (s.status === 'MiningPaused') {
    actionLabel = 'Resume mining';
  } else if (s.status === 'MiningActive') {
    actionLabel = 'Stop mining';
  } else if (s.status === 'ExtractionReady' || s.status === 'BatteryEmpty') {
    actionLabel = 'Run finished — crediting…';
  } else if (s.status === 'ReadyToMine') {
    actionLabel = 'Start';
  } else {
    actionLabel = 'Mining…';
  }

  const primaryIsRecharge = s.status === 'NeedsPower' || batteryDeadInRun;
  const showAuxRechargeButton =
    s.unlocked &&
    hasInstalledBattery(s.setup, s.type) &&
    !atFullEnergy &&
    batteryRatio < BATTERY_LOW_RECHARGE_THRESHOLD &&
    !primaryIsRecharge;

  const buyDisabled =
    s.status === 'DailyCapReached' || s.status === 'ExtractionReady' || s.status === 'BatteryEmpty';

  /** Setup changes only when not actively mining (paused / idle / extraction is OK). */
  const canEditParts = s.status !== 'MiningActive';

  const preset = MINECORE_PLANT_PRESETS[s.type ?? 'standard'];
  const IconComponent = (Icons as any)[preset.icon] ?? Icons.CircleDot;

  const showFeaturedPlantArt = s.unlocked;
  const plantFeaturedUrl = showFeaturedPlantArt ? preset.featuredImageUrl : undefined;
  const baseCapDisplay = MINECORE_PLANT_BASE_DIAMONDS_PER_24H[s.type ?? 'standard'];
  const baseUnitsDisplay = MINECORE_PLANT_BASE_POWER_UNITS[s.type ?? 'standard'];
  const moduleBadgeCopy =
    s.type === 'standard' ? 'No modules' : s.type === 'premium' ? 'Premium modules' : 'Advanced modules';
  const statCapsuleCls =
    'inline-flex max-w-full items-center rounded-full border border-white/30 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm';

  /** Primary CTA: orange when paused, neutral gray when mining; default games CTA for other states. */
  const buyButtonClassName =
    s.status === 'MiningPaused'
      ? 'h-10 w-full rounded-xl px-4 text-sm font-bold border-2 border-amber-500/60 bg-amber-500/25 text-amber-950 shadow-sm transition-colors hover:bg-amber-500/35 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-50 dark:hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50'
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
      mediaOverlayBottom={
        showFeaturedPlantArt && plantFeaturedUrl ? (
          <>
            <Tooltip
              content={`Base diamond budget for this plant tier (${preset.label}): ${baseCapDisplay} D/24h reference before rigs and modules.`}
            >
              <span className={statCapsuleCls}>{baseCapDisplay.toLocaleString()} Diamonds</span>
            </Tooltip>
            <Tooltip content={`Reserve power units for this plant tier (V1). Each mining run typically consumes reserve capacity alongside battery charge.`}>
              <span className={statCapsuleCls}>{baseUnitsDisplay} Units</span>
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
      title={`Mining Plant ${s.index + 1}`}
      category={preset.label}
      description={
        <div className="space-y-3">
          {s.unlocked ? (
            <DailyCapBar
              mined={dailyCap.minedTowardCap}
              cap={dailyCap.cap24h}
              ratio={dailyCap.ratio}
              setupIncomplete={!computePlantReady(s)}
              capReached={dailyCap.cap24h > 0 && dailyCap.minedTowardCap >= dailyCap.cap24h}
              remainingMs={capRemainingMs}
            />
          ) : null}

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {s.unlocked && s.setup.machineId ? (
              <span className={`inline-flex ${efficiencyBadgeClassName()}`}>Eff {effPct.toFixed(0)}%</span>
            ) : null}
            {props.minecoreState.automation.autoRestart && (
              <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-300">
                Auto ON
              </span>
            )}
          </div>

          {/* ── Setup checklist ── */}
          <div
            className="rounded-xl border border-zinc-100 bg-white/60 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-950/30 space-y-0.5"
            title={!canEditParts ? 'Stop mining to change machines, batteries, workers, or modules.' : undefined}
          >
            <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-1 px-2 pt-1">Setup</div>
            <CheckRow
              installed={!!s.setup.machineId}
              label="Machine"
              value={machineConfig?.label}
              stat={machineConfig ? `⚡ ×${machineConfig.powerConsumptionFactor}` : undefined}
              statTone="rose"
              tooltip={
                machineConfig
                  ? `${machineConfig.label}: +${machineConfig.diamondsPer24h} D/24h to plant cap, ${formatDuration(machineConfig.durationMs)} cycle, ×${machineConfig.powerConsumptionFactor} drain, +${(machineConfig.powerGridContribution * MINECORE_KW_SCALE).toFixed(0)} kW to plant bus, charge budget ×${machineConfig.powerBudgetMultiplier.toFixed(2)}.`
                  : 'No machine installed. Click to assign one.'
              }
              onClick={() => setActiveModal('machine')}
              disabled={!canEditParts}
            />
            {Array.from({ length: powerUnitCount }, (_, bi) => {
              const bid = s.setup.batteryIds[bi] ?? null;
              const bcfg = bid ? MINECORE_BATTERIES[bid] : null;
              return (
                <CheckRow
                  key={bi}
                  installed={!!bid}
                  label={powerUnitCount > 1 ? `Battery ${bi + 1}` : 'Battery'}
                  value={bcfg?.label}
                  stat={bcfg ? `${Math.round(bcfg.chargeCapacityMs / 60000)}m` : undefined}
                  tooltip={
                    bcfg
                      ? `${bcfg.label}: ${formatDuration(bcfg.chargeCapacityMs)} base charge, ×${bcfg.efficiency} efficiency bonus.`
                      : 'No battery in this power slot. Click to assign one.'
                  }
                  onClick={() => {
                    setBatterySlotFocus(bi);
                    setActiveModal('battery');
                  }}
                  disabled={!canEditParts}
                />
              );
            })}
            <CheckRow
              installed={!!s.setup.workerId}
              label="Workers"
              value={workerConfig ? `${workerConfig.label} · +${workerConfig.diamondBonusPer24h} D/24h` : 'None assigned'}
              stat={
                workerConfig
                  ? (() => {
                      const inv = props.minecoreState.owned.workers[s.setup.workerId!] ?? 0;
                      const plant = countWorkersAssigned(props.minecoreState.plantSlots, s.setup.workerId!);
                      const nft =
                        s.setup.workerId === 'worker' ? nftWorkerDeployed : s.setup.workerId === 'operator' ? nftOperatorDeployed : nftWorkerDeployed;
                  return `Fab ${displayAssignedCount(plant, inv)}/${inv} · NFT ${nft.filled}/${nft.capacity}`;
                    })()
                  : `NFT W ${nftWorkerDeployed.filled}/${nftWorkerDeployed.capacity} · Op ${nftOperatorDeployed.filled}/${nftOperatorDeployed.capacity}`
              }
              tooltip="Fabricated Workers/Operators equip your plant operator slot. Matching NFT crews in Workers tab stacks bonuses (NFT slot fills shown on the chip)."
              onClick={() => setActiveModal('worker')}
              disabled={!canEditParts}
            />
            {s.type !== 'standard' ? (
              <div className="px-2 pb-1 pt-0.5">
                <button
                  type="button"
                  disabled={!canEditParts}
                  onClick={() => canEditParts && setActiveModal('modules')}
                  className={`text-[11px] font-semibold ${canEditParts ? 'text-sky-600 hover:underline dark:text-sky-400' : 'cursor-not-allowed text-zinc-400'}`}
                >
                  Manage modules{s.setup.moduleIds.length > 0 ? ` (${s.setup.moduleIds.length} active)` : ''}
                </button>
              </div>
            ) : null}
          </div>

          {/* ── Resource bars ── */}
          {s.unlocked && s.setup.machineId ? (
            <Tooltip
              content={`Plant power grid: base plant + rig kW to the bus vs draw from the machine (and modules). Batteries do not add reserve units (V1). Production ${prodKw.toFixed(1)} kW, consumption ${consKw.toFixed(1)} kW, efficiency ${effPct.toFixed(0)}%.`}
            >
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Power grid</div>
              <div className="hidden grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-800 dark:text-zinc-200 md:grid">
                <span className="text-zinc-500">Production</span>
                <span className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{prodKw.toFixed(1)} kW</span>
                <span className="text-zinc-500">Consumption</span>
                <span className="text-right tabular-nums text-rose-600 dark:text-rose-400">{consKw.toFixed(1)} kW</span>
                <span className="text-zinc-500">Balance</span>
                <span className={`text-right tabular-nums ${balKw >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {balKw >= 0 ? '+' : ''}
                  {balKw.toFixed(1)} kW
                </span>
                <span className="text-zinc-500">Efficiency</span>
                <span className="text-right tabular-nums font-bold text-zinc-900 dark:text-zinc-100">{effPct.toFixed(0)}%</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] md:hidden">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Δ {balKw >= 0 ? '+' : ''}
                  {balKw.toFixed(0)} kW
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Eff {effPct.toFixed(0)}%</span>
                <span className="text-sky-600 dark:text-sky-400">{d24 > 0 ? `${d24} D/24h` : '—'}</span>
              </div>
              </div>
            </Tooltip>
          ) : null}

          {s.unlocked && (
            <div className="space-y-3">
              {/* Battery charge bar */}
              {capacityMs > 0 && (
                <ResourceBar
                  label={`Charge${cycle ? ` — ${formatDuration(batteryRuntimeMs)} runtime` : ''}`}
                  value={`${Math.floor(liveChargeMs / 60000)}m / ${Math.floor(capacityMs / 60000)}m`}
                  ratio={batteryRatio}
                  variant="battery"
                  tooltip={`Combined battery runtime. Draw scales with the machine. At 0 the run ends and mined diamonds are credited to your balance automatically—recharge to start again. ${Math.floor(liveChargeMs / 60000)} min remaining of ${Math.floor(capacityMs / 60000)} min capacity.`}
                />
              )}

              {/* Power units dots */}
              {capacityMs > 0 ? (
                <BatteryUnitDots segments={powerDotMax} chargeRatio={batteryRatio} />
              ) : null}
            </div>
          )}

          {showAuxRechargeButton ? (
            <button
              type="button"
              onClick={() => void props.onRechargePlant({ units: 1 })}
              className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300 dark:hover:bg-sky-500/20"
            >
              {`Recharge — ${MINECORE_PLANT_RECHARGE_COST_KAS} KAS (+1 unit & full battery)`}
            </button>
          ) : null}

          {/* ── Status warnings (above primary action) ── */}
          <div className="space-y-2">
            {s.status === 'DailyCapReached' && (
              <WarningBanner
                level="warn"
                message="Rolling 24h diamond budget is full. Refine in the Redeem tab, or wait for the window. Mining restarts only when you press Start (Foreman can still auto-refill a dead battery with Energy Cells)."
              />
            )}
            {s.status === 'SetupIncomplete' && (
              <WarningBanner level="warn" message={`✗ Missing: ${[!s.setup.machineId && 'Machine', !hasInstalledBattery(s.setup, s.type) && 'Battery', !s.setup.workerId && 'Worker'].filter(Boolean).join(', ')}`} />
            )}
            {batteryEmpty && s.status !== 'MiningPaused' && (
              <WarningBanner
                level="error"
                message="Battery depleted—mined diamonds were credited to your balance. Recharge, then start a new run manually (or use Foreman to auto-refill with Energy Cells if enabled)."
              />
            )}
            {batteryLow && !batteryEmpty && s.status !== 'MiningPaused' && (
              <WarningBanner level="warn" message={`Battery low — ${formatDuration(batteryRuntimeMs)} runtime left. Recharge to top up the battery and add reserve units.`} />
            )}
            {s.status === 'InsufficientPower' && (
              <WarningBanner
                level="warn"
                message={`Power bus deficit — production ${prodKw.toFixed(1)} kW vs consumption ${consKw.toFixed(1)} kW (${balKw >= 0 ? '+' : ''}${balKw.toFixed(1)} kW). Raise plant-tier reserve/rig bus output or lower draw (cooling modules, smaller rig) to reach ${effPct.toFixed(0)}% efficiency and unlock mining.`}
              />
            )}
            {s.status === 'NeedsPower' && (
              <WarningBanner level="error" message={`No reserve power units. Recharge (${MINECORE_PLANT_RECHARGE_COST_KAS} KAS) adds a unit and fully tops up the battery for the next run.`} />
            )}
            {s.status === 'NeedsRepair' && (
              <WarningBanner level="error" message="🔧 Plant damaged — repair required before resuming." />
            )}
          </div>
        </div>
      }
      effects={[]}
      hidePricing={true}
      priceOptions={[{ currency: 'KAS', unitPrice: 0 }]}
      buyLabel={actionLabel}
      buyDisabled={buyDisabled}
      buyButtonClassName={buyButtonClassName}
      onBuy={async () => {
        if (!s.unlocked) return props.onUnlock();
        if (s.status === 'SetupIncomplete') return setActiveModal('machine');
        if (s.status === 'NeedsRepair') return props.onRepairWithKAS({ amountKas: MINECORE_PLANT_REPAIR_KAS });
        if (s.status === 'InsufficientPower') return setActiveModal('machine');
        if (s.status === 'DailyCapReached') return;
        if (batteryDeadInRun || s.status === 'NeedsPower') return props.onRechargePlant({ units: 1 });
        if (s.status === 'MiningPaused') return props.onResumeMining();
        if (s.status === 'MiningActive') return props.onStopMining();
        if (s.status === 'ExtractionReady' || s.status === 'BatteryEmpty') return;
        if (s.status === 'ReadyToMine') return props.onStart();
      }}
    />

    {/* ── Selection Modals ── */}
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
                        {p.costKas <= 0 ? '—' : `${p.costKas} KAS`}
                      </span>
                    </div>
                    <div className="flex min-w-[3.5rem] flex-col items-end">
                      <span className="text-[10px] font-semibold text-zinc-400">Status</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{isCurrent ? 'Current' : '—'}</span>
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
        <ul className="space-y-2">
          {Object.values(MINECORE_MACHINES).map((m) => {
            const owned = props.minecoreState.owned.machines[m.id] ?? 0;
            const assignedElsewhere = countMachinesAssignedExcept(props.minecoreState.plantSlots, m.id, s.index);
            const canPick = assignedElsewhere + 1 <= owned;
            const isInstalled = s.setup.machineId === m.id;
            return (
              <li key={m.id} className="list-none">
                <ModalPartRow
                  title={m.label}
                  subtitle={`+${m.diamondsPer24h} D/24h cap · ${formatDuration(m.durationMs)} · +${(m.powerGridContribution * MINECORE_KW_SCALE).toFixed(0)} kW bus · Budget ×${m.powerBudgetMultiplier.toFixed(2)} · Drain ×${m.powerConsumptionFactor}`}
                  owned={owned}
                  inUse={displayAssignedCount(countMachinesAssigned(props.minecoreState.plantSlots, m.id), owned)}
                  disabled={!canPick && !isInstalled}
                  selected={isInstalled}
                  onClick={() => {
                    props.onInstallPart('machine', m.id);
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            props.onInstallPart('machine', null);
            setActiveModal(null);
          }}
          className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
        >
          Remove machine
        </button>
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'battery'}
        onClose={() => setActiveModal(null)}
        title={powerUnitCount > 1 ? `Assign battery — power unit ${batterySlotFocus + 1}` : 'Assign Battery'}
      >
        <ul className="space-y-2">
          {Object.values(MINECORE_BATTERIES).map((b) => {
            const owned = props.minecoreState.owned.batteries[b.id] ?? 0;
            const isInstalled = s.setup.batteryIds[batterySlotFocus] === b.id;
            const canPick = canAssignBatteryToPlantSlot(
              props.minecoreState.plantSlots,
              s.index,
              batterySlotFocus,
              b.id,
              owned,
            );
            return (
              <li key={b.id} className="list-none">
                <ModalPartRow
                  title={b.label}
                  subtitle={`Runtime ${formatDuration(b.chargeCapacityMs)} · Daily cap ×${b.efficiency} — reserve units = plant tier (V1)`}
                  owned={owned}
                  inUse={displayAssignedCount(countBatteriesAssigned(props.minecoreState.plantSlots, b.id), owned)}
                  disabled={!canPick && !isInstalled}
                  selected={isInstalled}
                  onClick={() => {
                    props.onInstallPart('battery', b.id, batterySlotFocus);
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        {s.setup.batteryIds?.[batterySlotFocus] ? (
          <button
            type="button"
            onClick={() => {
              props.onInstallPart('battery', null, batterySlotFocus);
              setActiveModal(null);
            }}
            className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
          >
            Remove battery from this slot
          </button>
        ) : null}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'worker'}
        onClose={() => setActiveModal(null)}
        title="Assign Worker"
      >
        <ul className="space-y-2">
          {Object.values(MINECORE_WORKERS).map((w) => {
            const owned = props.minecoreState.owned.workers[w.id] ?? 0;
            const assignedElsewhere = countWorkersAssignedExcept(props.minecoreState.plantSlots, w.id, s.index);
            const canPick = assignedElsewhere + 1 <= owned;
            const isInstalled = s.setup.workerId === w.id;
            const nftFill = nftTabSlotDeployments(props.minecoreState.nftSlots ?? [], w.id);
            return (
              <li key={w.id} className="list-none">
                <ModalPartRow
                  title={w.label}
                  subtitle={`Workers tab NFT ${nftFill.filled}/${nftFill.capacity} · +${w.diamondBonusPer24h} D/24h cap (fabricated units assign to plants)`}
                  owned={owned}
                  inUse={displayAssignedCount(countWorkersAssigned(props.minecoreState.plantSlots, w.id), owned)}
                  disabled={!canPick && !isInstalled}
                  selected={isInstalled}
                  onClick={() => {
                    props.onInstallPart('worker', w.id);
                    setActiveModal(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            props.onInstallPart('worker', null);
            setActiveModal(null);
          }}
          className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
        >
          Remove worker
        </button>
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
              !inventoryAllowsPlantSetup(props.minecoreState, s.index, { ...s.setup, moduleIds: nextIfAdd });
            const specParts = [
              m.kind === 'output' ? `+${(m.outputBonus * 100).toFixed(0)}% output` : '',
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
          <button
            type="button"
            onClick={() => {
              props.onInstallPart('modules', []);
              setActiveModal(null);
            }}
            className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
          >
            Clear all modules
          </button>
        ) : null}
      </SelectionModal>
    </>
  );
}
