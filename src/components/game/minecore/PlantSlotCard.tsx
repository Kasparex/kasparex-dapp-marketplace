'use client';

import type { CSSProperties } from 'react';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { MinecoreState, PlantSlotState } from '@/lib/game/minecore';
import {
  computeLiveBatteryChargeMs,
  computeLiveDiamonds,
  computeFlowRatePerMin,
  computePlantExpectedDiamonds,
  getBatteryCapacityMs,
} from '@/lib/game/minecore/compute';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_PLANT_PRESETS,
  MINECORE_WORKERS,
} from '@/lib/game/minecore/config';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(n: number) { return n <= 0 ? 0 : n >= 1 ? 1 : n; }

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function statusBadge(status: PlantSlotState['status']) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide';
  if (status === 'MiningActive')    return `${base} border border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300`;
  if (status === 'ExtractionReady') return `${base} border border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-300`;
  if (status === 'ReadyToMine')     return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300`;
  if (status === 'SetupIncomplete') return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300`;
  if (status === 'BatteryEmpty')    return `${base} border border-orange-500/30 bg-orange-500/15 text-orange-800 dark:text-orange-300`;
  if (status === 'NeedsPower' || status === 'NeedsRepair') return `${base} border border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300`;
  return `${base} border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
}

function labelForStatus(status: PlantSlotState['status']) {
  if (status === 'EmptySlot')       return 'Empty slot';
  if (status === 'SetupIncomplete') return 'Setup incomplete';
  if (status === 'ReadyToMine')     return 'Ready';
  if (status === 'MiningActive')    return 'Mining active';
  if (status === 'BatteryEmpty')    return 'Battery empty';
  if (status === 'ExtractionReady') return 'Extraction ready';
  if (status === 'NeedsRepair')     return 'Needs repair';
  if (status === 'NeedsPower')      return 'Needs power';
  return status;
}

function SelectionModal(props: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    if (props.isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [props.isOpen, props.onClose]);

  if (!props.isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={props.onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
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
  tooltip: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip content={props.tooltip}>
      <div
        className="flex items-center gap-2 py-2 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors group"
        onClick={props.onClick}
      >
        <span className={`flex-shrink-0 text-sm font-black ${props.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {props.installed ? '✓' : '✗'}
        </span>
        <span className={`text-xs font-semibold w-14 flex-shrink-0 ${props.installed ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {props.label}
        </span>
        <span className={`text-xs truncate flex-1 font-medium ${props.installed ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600 italic'}`}>
          {props.value ?? 'Tap to assign…'}
        </span>
        {props.stat ? (
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
            {props.stat}
          </span>
        ) : null}
        <Icons.ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors" />
      </div>
    </Tooltip>
  );
}

/** Color-coded horizontal bar with label + value */
function ResourceBar(props: {
  label: string;
  value: string;
  ratio: number;
  variant: 'battery' | 'power' | 'cycle';
  warning?: string | null;
}) {
  const r = clamp01(props.ratio);

  let barColor: string;
  if (props.variant === 'cycle') {
    barColor = 'bg-emerald-500';
  } else if (props.variant === 'battery') {
    barColor = r > 0.6 ? 'bg-emerald-500' : r > 0.2 ? 'bg-amber-500' : 'bg-rose-500';
  } else {
    barColor = r > 0.4 ? 'bg-sky-500' : 'bg-rose-500';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{props.label}</span>
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
}

/** Discrete dot indicator for power fuel units */
function PowerDots(props: { current: number; max: number }) {
  const safeMax = Math.max(1, Math.min(props.max, 10));
  const dots = Array.from({ length: safeMax }, (_, i) => i < props.current);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Power units</span>
        <span className="text-xs font-black tabular-nums text-zinc-800 dark:text-zinc-100">{props.current} / {safeMax}</span>
      </div>
      <div className="flex gap-1">
        {dots.map((filled, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-sm transition-colors ${filled ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
          />
        ))}
      </div>
    </div>
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
  onTopUpWithKAS: (args: { amountKas: number; added: number }) => void | Promise<void>;
  onRefillBattery: () => void | Promise<void>;
  onQuickSetup: () => void;
  onInstallPart: (kind: any, id: any) => void;
  onChangePlantType: (type: any, cost: number) => void;
}) {
  const s   = props.slot;
  const now = props.now;

  const [activeModal, setActiveModal] = useState<'machine' | 'battery' | 'worker' | 'preset' | null>(null);

  // ── Live computed values ─────────────────────────────────────────────────
  const cycle              = s.cycle;
  const cycleProgress      = cycle ? clamp01((now - cycle.startAtMs) / Math.max(1, cycle.endAtMs - cycle.startAtMs)) : 0;
  const cycleRemainingMs   = cycle ? Math.max(0, cycle.endAtMs - now) : 0;

  const liveChargeMs    = computeLiveBatteryChargeMs(s, now);
  const capacityMs      = getBatteryCapacityMs(s);
  const batteryRatio    = capacityMs > 0 ? liveChargeMs / capacityMs : 0;
  const batteryLow      = batteryRatio < 0.2 && batteryRatio > 0;
  const batteryEmpty    = liveChargeMs <= 0 && cycle != null;
  const batteryRuntimeMs = capacityMs > 0 && s.setup.machineId
    ? liveChargeMs / (MINECORE_MACHINES[s.setup.machineId]?.powerConsumptionFactor ?? 1)
    : 0;

  const liveDiamonds    = computeLiveDiamonds(s, now);
  const flowPerMin      = computeFlowRatePerMin(s, now);
  const expectedDiamonds = cycle ? cycle.expectedDiamonds : computePlantExpectedDiamonds(props.minecoreState, s);

  // ── Config lookups ───────────────────────────────────────────────────────
  const machineConfig   = s.setup.machineId ? MINECORE_MACHINES[s.setup.machineId] : null;
  const batteryConfig   = s.setup.batteryId ? MINECORE_BATTERIES[s.setup.batteryId] : null;
  const workerConfig    = s.setup.workerId  ? MINECORE_WORKERS[s.setup.workerId]    : null;
  const powerDotMax     = batteryConfig?.powerCapacity ?? 5;

  // ── Action label ─────────────────────────────────────────────────────────
  const actionLabel =
    !s.unlocked             ? `Unlock ${s.unlockCostKas.toLocaleString()} KAS` :
    s.status === 'SetupIncomplete' ? 'Quick setup' :
    s.status === 'ReadyToMine'     ? 'Start' :
    s.status === 'ExtractionReady' ? 'Extract' :
    s.status === 'BatteryEmpty'    ? 'Extract (partial)' :
    s.status === 'NeedsPower'      ? `Top up — 1 KAS` :
    s.status === 'NeedsRepair'     ? 'Repair' :
    'Mining…';

  const buyDisabled = s.status === 'MiningActive';

  const preset = MINECORE_PLANT_PRESETS[s.type ?? 'standard'];
  const IconComponent = (Icons as any)[preset.icon] ?? Icons.CircleDot;

  // ── Title accessory — live diamond display ───────────────────────────────
  const titleAccessory = s.unlocked ? (
    <div className="text-right">
      <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
        {cycle ? 'Mined' : 'Expected'}
      </div>
      <div className="text-lg font-black tabular-nums leading-tight text-amber-500 dark:text-amber-300 sm:text-xl">
        {(cycle ? liveDiamonds : expectedDiamonds).toLocaleString()}
      </div>
      <div className="text-[9px] font-semibold text-amber-700/80 dark:text-amber-200/70">
        {cycle && flowPerMin > 0 ? `+${flowPerMin.toFixed(1)} D/min` : 'Diamonds / cycle'}
      </div>
    </div>
  ) : null;

  return (
    <>
    <GameItemCard
      icon={
        <div
          className="cursor-pointer group relative"
          onClick={() => setActiveModal('preset')}
        >
          <div className="absolute inset-0 bg-sky-500/10 rounded-full scale-125 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <IconComponent className="h-5 w-5 text-sky-400 group-hover:text-sky-300 transition-colors relative z-10" />
        </div>
      }
      titleAccessory={titleAccessory}
      title={`Mining Plant ${s.index + 1}`}
      category={preset.label}
      description={
        <div className="space-y-3">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {props.minecoreState.automation.autoRestart && (
              <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-300">
                Auto ON
              </span>
            )}
          </div>

          {/* ── Setup checklist ── */}
          <div className="rounded-xl border border-zinc-100 bg-white/60 px-1 py-1 dark:border-zinc-800 dark:bg-zinc-950/30 space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 px-2 pt-1">Setup</div>
            <CheckRow
              installed={!!s.setup.machineId}
              label="Machine"
              value={machineConfig?.label}
              stat={machineConfig ? `⚡ ×${machineConfig.powerConsumptionFactor}` : undefined}
              tooltip={machineConfig ? `${machineConfig.label}: ${machineConfig.baseOutput} base output, ${formatDuration(machineConfig.durationMs)} cycle, ×${machineConfig.powerConsumptionFactor} battery drain rate.` : 'No machine installed. Click to assign one.'}
              onClick={() => !buyDisabled && setActiveModal('machine')}
            />
            <CheckRow
              installed={!!s.setup.batteryId}
              label="Battery"
              value={batteryConfig?.label}
              stat={batteryConfig ? `${Math.round(batteryConfig.chargeCapacityMs / 60000)}m` : undefined}
              tooltip={batteryConfig ? `${batteryConfig.label}: ${formatDuration(batteryConfig.chargeCapacityMs)} base charge, ×${batteryConfig.efficiency} efficiency bonus.` : 'No battery installed. Click to assign one.'}
              onClick={() => !buyDisabled && setActiveModal('battery')}
            />
            <CheckRow
              installed={!!s.setup.workerId}
              label="Worker"
              value={workerConfig?.label}
              stat={workerConfig ? `×${workerConfig.multiplier}` : undefined}
              tooltip={workerConfig ? `${workerConfig.label}: applies ×${workerConfig.multiplier} multiplier to diamond output.` : 'No worker assigned. Click to assign one.'}
              onClick={() => !buyDisabled && setActiveModal('worker')}
            />
          </div>

          {/* ── Status warnings ── */}
          {s.status === 'SetupIncomplete' && (
            <WarningBanner level="warn" message={`✗ Missing: ${[!s.setup.machineId && 'Machine', !s.setup.batteryId && 'Battery', !s.setup.workerId && 'Worker'].filter(Boolean).join(', ')}`} />
          )}
          {batteryEmpty && (
            <WarningBanner level="error" message="⚡ Battery depleted — mining paused. Extract partial diamonds or refill and continue." />
          )}
          {batteryLow && !batteryEmpty && (
            <WarningBanner level="warn" message={`⚡ Battery low — ${formatDuration(batteryRuntimeMs)} remaining. Refill to avoid halting.`} />
          )}
          {s.status === 'NeedsPower' && (
            <WarningBanner level="error" message="🔴 No power units — top up to start the next cycle." />
          )}
          {s.status === 'NeedsRepair' && (
            <WarningBanner level="error" message="🔧 Plant damaged — repair required before resuming." />
          )}

          {/* ── Resource bars ── */}
          {s.unlocked && (
            <div className="space-y-3">
              {/* Cycle progress bar */}
              {cycle && (
                <ResourceBar
                  label={`Cycle progress — ${formatDuration(cycleRemainingMs)} left`}
                  value={`${Math.round(cycleProgress * 100)}%`}
                  ratio={cycleProgress}
                  variant="cycle"
                />
              )}

              {/* Battery charge bar */}
              {capacityMs > 0 && (
                <ResourceBar
                  label={`Battery charge${cycle ? ` — ${formatDuration(batteryRuntimeMs)} left` : ''}`}
                  value={`${Math.round(batteryRatio * 100)}%`}
                  ratio={batteryRatio}
                  variant="battery"
                />
              )}

              {/* Power units dots */}
              <PowerDots current={s.powerRemaining} max={powerDotMax} />
            </div>
          )}

          {/* ── Refill battery button (shown when low/empty) ── */}
          {s.unlocked && s.setup.batteryId && (batteryLow || batteryEmpty || s.status === 'NeedsPower') && (
            <button
              type="button"
              onClick={() => props.onRefillBattery()}
              className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300 dark:hover:bg-sky-500/20"
            >
              ⚡ Refill Battery — 2.5 KAS
            </button>
          )}
        </div>
      }
      effects={[]}
      hidePricing={true}
      priceOptions={[{ currency: 'KAS', unitPrice: 0 }]}
      buyLabel={actionLabel}
      buyDisabled={buyDisabled}
      onBuy={async () => {
        if (!s.unlocked)                    return props.onUnlock();
        if (s.status === 'SetupIncomplete') return setActiveModal('machine');
        if (s.status === 'ReadyToMine')     return props.onStart();
        if (s.status === 'ExtractionReady') return props.onExtract();
        if (s.status === 'BatteryEmpty')    return props.onExtract();
        if (s.status === 'NeedsPower')      return props.onTopUpWithKAS({ amountKas: 1, added: 1 });
        if (s.status === 'NeedsRepair')     return props.onRepairWithKAS({ amountKas: 2 });
      }}
    />

    {/* ── Selection Modals ── */}
      <SelectionModal
        isOpen={activeModal === 'preset'}
        onClose={() => setActiveModal(null)}
        title="Upgrade Plant"
      >
        {Object.values(MINECORE_PLANT_PRESETS).map((p) => {
          const Icon = (Icons as any)[p.icon] ?? Icons.CircleDot;
          const isCurrent = s.type === p.type;
          return (
            <button
              key={p.type}
              onClick={() => {
                if (!isCurrent) props.onChangePlantType(p.type, p.costKas);
                setActiveModal(null);
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                isCurrent
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">{p.label}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</div>
                {p.costKas > 0 && !isCurrent && (
                  <div className="text-[10px] font-black text-sky-600 uppercase mt-1">Upgrade: {p.costKas} KAS</div>
                )}
              </div>
              {isCurrent && <Icons.Check className="w-5 h-5 text-sky-500" />}
            </button>
          );
        })}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'machine'}
        onClose={() => setActiveModal(null)}
        title="Assign Machine"
      >
        {Object.values(MINECORE_MACHINES).map((m) => {
          const owned = props.minecoreState.owned.machines[m.id] ?? 0;
          const isInstalled = s.setup.machineId === m.id;
          return (
            <button
              key={m.id}
              disabled={owned <= 0 && !isInstalled}
              onClick={() => {
                props.onInstallPart('machine', m.id);
                setActiveModal(null);
              }}
              className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                isInstalled ? 'border-sky-500 bg-sky-500/5' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
              } disabled:opacity-40`}
            >
              <div>
                <div className="font-bold text-sm">{m.label}</div>
                <div className="text-[10px] text-zinc-500">{m.baseOutput} D · {formatDuration(m.durationMs)}</div>
              </div>
              <div className="text-xs font-black text-zinc-400">Owned: {owned}</div>
            </button>
          );
        })}
        <button
          onClick={() => { props.onInstallPart('machine', null); setActiveModal(null); }}
          className="w-full p-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        >
          Remove Machine
        </button>
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'battery'}
        onClose={() => setActiveModal(null)}
        title="Assign Battery"
      >
        {Object.values(MINECORE_BATTERIES).map((b) => {
          const owned = props.minecoreState.owned.batteries[b.id] ?? 0;
          const isInstalled = s.setup.batteryId === b.id;
          return (
            <button
              key={b.id}
              disabled={owned <= 0 && !isInstalled}
              onClick={() => {
                props.onInstallPart('battery', b.id);
                setActiveModal(null);
              }}
              className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                isInstalled ? 'border-sky-500 bg-sky-500/5' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
              } disabled:opacity-40`}
            >
              <div>
                <div className="font-bold text-sm">{b.label}</div>
                <div className="text-[10px] text-zinc-500">{formatDuration(b.chargeCapacityMs)} charge · {b.powerCapacity} units</div>
              </div>
              <div className="text-xs font-black text-zinc-400">Owned: {owned}</div>
            </button>
          );
        })}
      </SelectionModal>

      <SelectionModal
        isOpen={activeModal === 'worker'}
        onClose={() => setActiveModal(null)}
        title="Assign Worker"
      >
        {Object.values(MINECORE_WORKERS).map((w) => {
          const owned = props.minecoreState.owned.workers[w.id] ?? 0;
          const isInstalled = s.setup.workerId === w.id;
          return (
            <button
              key={w.id}
              disabled={owned <= 0 && !isInstalled}
              onClick={() => {
                props.onInstallPart('worker', w.id);
                setActiveModal(null);
              }}
              className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                isInstalled ? 'border-sky-500 bg-sky-500/5' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
              } disabled:opacity-40`}
            >
              <div>
                <div className="font-bold text-sm">{w.label}</div>
                <div className="text-[10px] text-zinc-500">×{w.multiplier} Output multiplier</div>
              </div>
              <div className="text-xs font-black text-zinc-400">Owned: {owned}</div>
            </button>
          );
        })}
      </SelectionModal>
    </>
  );
}
