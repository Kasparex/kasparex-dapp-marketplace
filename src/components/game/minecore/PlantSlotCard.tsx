'use client';

import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { MinecoreState, PlantSlotState } from '@/lib/game/minecore';
import { computePlantExpectedDiamonds } from '@/lib/game/minecore/compute';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { MINECORE_BATTERIES, MINECORE_MACHINES } from '@/lib/game/minecore/config';

function clamp01(n: number) {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
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

function statusBadge(status: PlantSlotState['status']) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide';
  if (status === 'MiningActive') return `${base} border border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300`;
  if (status === 'ExtractionReady') return `${base} border border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-300`;
  if (status === 'ReadyToMine') return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300`;
  if (status === 'SetupIncomplete') return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300`;
  if (status === 'NeedsPower' || status === 'NeedsRepair') return `${base} border border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300`;
  return `${base} border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
}

function labelForStatus(status: PlantSlotState['status']) {
  if (status === 'EmptySlot') return 'Empty slot';
  if (status === 'SetupIncomplete') return 'Setup incomplete';
  if (status === 'ReadyToMine') return 'Ready';
  if (status === 'MiningActive') return 'Mining active';
  if (status === 'ExtractionReady') return 'Extraction ready';
  if (status === 'NeedsRepair') return 'Needs repair';
  if (status === 'NeedsPower') return 'Needs power';
  return status;
}

function barToneClass(ratio: number) {
  const r = clamp01(ratio);
  if (r < 0.15) return 'bg-red-500';
  if (r < 0.45) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function StatusCapsule(props: { label: string; value: string; ratio: number }) {
  const r = clamp01(props.ratio);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{props.label}</span>
        <span className="text-xs font-black tabular-nums text-zinc-900 dark:text-zinc-100">{props.value}</span>
      </div>
      <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full transition-[width] duration-300 ${barToneClass(r)}`} style={{ width: `${Math.round(r * 100)}%` }} />
      </div>
    </div>
  );
}

export function PlantSlotCard(props: {
  minecoreState: MinecoreState;
  slot: PlantSlotState;
  onUnlock: () => void;
  onStart: () => void;
  onExtract: () => void;
  onTopUpWithKAS: (args: { amountKas: number; added: number }) => void | Promise<void>;
  onRepairWithKAS: (args: { amountKas: number }) => void | Promise<void>;
  onQuickSetup: () => void;
}) {
  const s = props.slot;
  const now = Date.now();

  const cycle = s.cycle;
  const progress = cycle ? clamp01((now - cycle.startAtMs) / Math.max(1, cycle.endAtMs - cycle.startAtMs)) : 0;
  const remainingMs = cycle ? Math.max(0, cycle.endAtMs - now) : 0;

  const batteryCap = s.setup.batteryId ? (MINECORE_BATTERIES[s.setup.batteryId]?.powerCapacity ?? 0) : 0;
  const durationMs = s.setup.machineId ? (MINECORE_MACHINES[s.setup.machineId]?.durationMs ?? 0) : 0;
  const expectedFromLogic = computePlantExpectedDiamonds(props.minecoreState, s);
  const expectedDiamonds = cycle ? cycle.expectedDiamonds : expectedFromLogic;
  const flowPerSecond =
    cycle && now < cycle.endAtMs ? cycle.expectedDiamonds / Math.max(1, cycle.durationMs) : durationMs > 0 && expectedFromLogic > 0 ? expectedFromLogic / durationMs : 0;

  const powerRatio = batteryCap > 0 ? s.powerRemaining / batteryCap : 0;
  const batteryLabel = s.setup.batteryId ? s.setup.batteryId.replace(/-/g, ' ') : 'Not installed';

  const effects = [{ label: 'Status', value: labelForStatus(s.status) }];

  const actionLabel =
    !s.unlocked ? `Unlock ${s.unlockCostKas.toLocaleString()} KAS` :
    s.status === 'SetupIncomplete' ? 'Quick setup' :
    s.status === 'ReadyToMine' ? 'Start' :
    s.status === 'ExtractionReady' ? 'Extract' :
    s.status === 'NeedsPower' ? 'Top up power' :
    s.status === 'NeedsRepair' ? 'Repair' :
    'Mining active';

  const buyDisabled = s.status === 'MiningActive';

  const expectedOverlay =
    s.unlocked && expectedDiamonds > 0 ? (
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-yellow-100 drop-shadow-sm">Expected</div>
        <div className="text-xl font-black tabular-nums leading-tight text-yellow-300 drop-shadow-md sm:text-2xl">{expectedDiamonds.toLocaleString()}</div>
        <div className="text-[9px] font-semibold text-yellow-100/90 drop-shadow-sm">Diamonds / cycle</div>
      </div>
    ) : s.unlocked ? (
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-yellow-100/80">Expected</div>
        <div className="text-lg font-black tabular-nums text-yellow-200/90 sm:text-xl">—</div>
      </div>
    ) : null;

  return (
    <GameItemCard
      icon={<DiamondIcon className="h-5 w-5 text-sky-400" title="Diamonds" />}
      mediaOverlay={expectedOverlay}
      title={`Power Plant ${s.index + 1}`}
      category="Power Plant"
      description={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {cycle ? <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{formatDuration(remainingMs)} left</span> : null}
          </div>

          <div className="grid gap-2">
            <Tooltip content="Instantaneous diamond output for this plant (same formula as the active cycle).">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Flow rate</div>
                <div className="mt-0.5 font-mono text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">{flowPerSecond.toFixed(3)} D/s</div>
              </div>
            </Tooltip>
            <StatusCapsule label="Power" value={`${s.powerRemaining.toLocaleString()} / ${batteryCap.toLocaleString()}`} ratio={powerRatio} />
            <StatusCapsule label="Battery" value={batteryLabel} ratio={powerRatio} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Tooltip content="Machine tier sets base output and duration.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Machine</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.machineId ?? 'Not set'}</div>
              </div>
            </Tooltip>
            <Tooltip content="Worker tier applies a multiplier to expected diamonds (see compute).">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Worker</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.workerId ?? 'Not set'}</div>
              </div>
            </Tooltip>
            <Tooltip content="Modules improve output and reduce failures later.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30 sm:col-span-2">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Modules</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.moduleIds.length ? s.setup.moduleIds.join(', ') : 'None'}</div>
              </div>
            </Tooltip>
          </div>

          {cycle ? (
            <div className="rounded-xl border border-zinc-100 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Cycle progress</div>
                <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{Math.round(progress * 100)}%</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      }
      effects={effects}
      hidePricing={true}
      priceOptions={[{ currency: 'KAS', unitPrice: 0 }]}
      buyLabel={actionLabel}
      buyDisabled={buyDisabled}
      onBuy={async () => {
        if (!s.unlocked) return props.onUnlock();
        if (s.status === 'SetupIncomplete') return props.onQuickSetup();
        if (s.status === 'ReadyToMine') return props.onStart();
        if (s.status === 'ExtractionReady') return props.onExtract();
        if (s.status === 'NeedsPower') return props.onTopUpWithKAS({ amountKas: 1, added: 1 });
        if (s.status === 'NeedsRepair') return props.onRepairWithKAS({ amountKas: 2 });
      }}
    />
  );
}
