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
import { MINECORE_BATTERIES, MINECORE_MACHINES, MINECORE_WORKERS } from '@/lib/game/minecore/config';

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

// ── Sub-components ───────────────────────────────────────────────────────────

/** ✓ / ✗ row for the setup checklist */
function CheckRow(props: {
  installed: boolean;
  label: string;
  value?: string;
  stat?: string;
  tooltip: string;
}) {
  return (
    <Tooltip content={props.tooltip}>
      <div className="flex items-center gap-2 py-1 cursor-help">
        <span className={`flex-shrink-0 text-sm font-black ${props.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {props.installed ? '✓' : '✗'}
        </span>
        <span className={`text-xs font-semibold w-14 flex-shrink-0 ${props.installed ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {props.label}
        </span>
        <span className={`text-xs truncate flex-1 ${props.installed ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {props.value ?? '—'}
        </span>
        {props.stat ? (
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex-shrink-0">{props.stat}</span>
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
      {props.current <= 0 && (
        <div className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">No power units — top up to start next cycle</div>
      )}
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
  onTopUpWithKAS: (args: { amountKas: number; added: number }) => void | Promise<void>;
  onRepairWithKAS: (args: { amountKas: number }) => void | Promise<void>;
  onRefillBattery: () => void | Promise<void>;
  onQuickSetup: () => void;
}) {
  const s   = props.slot;
  const now = props.now;

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
    s.status === 'NeedsPower'      ? 'Top up power' :
    s.status === 'NeedsRepair'     ? 'Repair' :
    'Mining…';

  const buyDisabled = s.status === 'MiningActive';

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
    <GameItemCard
      icon={<DiamondIcon className="h-5 w-5 text-sky-400" title="Diamonds" />}
      titleAccessory={titleAccessory}
      title={`Mining Plant ${s.index + 1}`}
      category="Mining Plant"
      description={
        <div className="space-y-3">
          {/* Status badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {cycle && s.status === 'MiningActive' && (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {formatDuration(cycleRemainingMs)} left
              </span>
            )}
          </div>

          {/* ── Setup checklist ── */}
          <div className="rounded-xl border border-zinc-100 bg-white/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30 space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Setup</div>
            <CheckRow
              installed={!!s.setup.machineId}
              label="Machine"
              value={machineConfig?.label}
              stat={machineConfig ? `⚡ ×${machineConfig.powerConsumptionFactor} drain` : undefined}
              tooltip={machineConfig ? `${machineConfig.label}: ${machineConfig.baseOutput} base output, ${formatDuration(machineConfig.durationMs)} cycle, ×${machineConfig.powerConsumptionFactor} battery drain rate.` : 'No machine installed. Go to Build tab to craft one.'}
            />
            <CheckRow
              installed={!!s.setup.batteryId}
              label="Battery"
              value={batteryConfig?.label}
              stat={batteryConfig ? formatDuration(batteryConfig.chargeCapacityMs) : undefined}
              tooltip={batteryConfig ? `${batteryConfig.label}: ${formatDuration(batteryConfig.chargeCapacityMs)} base charge, ×${batteryConfig.efficiency} efficiency bonus.` : 'No battery installed. Go to Build tab to craft one.'}
            />
            <CheckRow
              installed={!!s.setup.workerId}
              label="Worker"
              value={workerConfig?.label}
              stat={workerConfig ? `×${workerConfig.multiplier} output` : undefined}
              tooltip={workerConfig ? `${workerConfig.label}: applies ×${workerConfig.multiplier} multiplier to diamond output.` : 'No worker assigned. Deploy a KREXPRIME or PixelKrex NFT in the Workers tab.'}
            />
            <CheckRow
              installed={s.setup.moduleIds.length > 0}
              label="Modules"
              value={s.setup.moduleIds.length > 0 ? s.setup.moduleIds.join(', ') : 'None'}
              tooltip="Optional modules boost output and reduce repair chance."
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
              {/* Battery charge bar */}
              {capacityMs > 0 && (
                <ResourceBar
                  label={`Battery charge${cycle ? ` — ${formatDuration(batteryRuntimeMs)} left` : ''}`}
                  value={`${Math.round(batteryRatio * 100)}%`}
                  ratio={batteryRatio}
                  variant="battery"
                />
              )}

              {/* Cycle progress bar */}
              {cycle && (
                <ResourceBar
                  label={`Cycle progress — ${formatDuration(cycleRemainingMs)} left`}
                  value={`${Math.round(cycleProgress * 100)}%`}
                  ratio={cycleProgress}
                  variant="cycle"
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
        if (s.status === 'SetupIncomplete') return props.onQuickSetup();
        if (s.status === 'ReadyToMine')     return props.onStart();
        if (s.status === 'ExtractionReady') return props.onExtract();
        if (s.status === 'BatteryEmpty')    return props.onExtract();
        if (s.status === 'NeedsPower')      return props.onTopUpWithKAS({ amountKas: 1, added: 1 });
        if (s.status === 'NeedsRepair')     return props.onRepairWithKAS({ amountKas: 2 });
      }}
    />
  );
}
