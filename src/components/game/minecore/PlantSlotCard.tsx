'use client';

import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { PlantSlotState } from '@/lib/game/minecore';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { MINECORE_BATTERIES } from '@/lib/game/minecore/config';

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

export function PlantSlotCard(props: {
  slot: PlantSlotState;
  diamondsBalance: number;
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
  const flowPerSecond = cycle ? cycle.expectedDiamonds / Math.max(1, cycle.durationMs) : 0;

  const effects = [
    { label: 'Status', value: labelForStatus(s.status) },
    { label: 'Flow', value: `${flowPerSecond.toFixed(3)} D/s` },
    { label: 'Power', value: `${s.powerRemaining.toLocaleString()} / ${batteryCap.toLocaleString()}` },
    { label: 'Expected', value: cycle ? cycle.expectedDiamonds.toLocaleString() : '0' },
  ];

  const actionLabel =
    !s.unlocked ? `Unlock ${s.unlockCostKas.toLocaleString()} KAS` :
    s.status === 'SetupIncomplete' ? 'Quick setup' :
    s.status === 'ReadyToMine' ? 'Start' :
    s.status === 'ExtractionReady' ? 'Extract' :
    s.status === 'NeedsPower' ? 'Top up power' :
    s.status === 'NeedsRepair' ? 'Repair' :
    'Mining active';

  const buyDisabled = s.status === 'MiningActive';

  return (
    <GameItemCard
      icon={<DiamondIcon className="h-5 w-5 text-sky-400" title="Diamonds" />}
      title={`Plant slot ${s.index + 1}`}
      category="Plant"
      description={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {cycle ? <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{formatDuration(remainingMs)} left</span> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Tooltip content="Machine tier sets base output and duration.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Machine</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.machineId ?? 'Not set'}</div>
              </div>
            </Tooltip>
            <Tooltip content="Battery determines power capacity and efficiency.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Battery</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.batteryId ?? 'Not set'}</div>
              </div>
            </Tooltip>
            <Tooltip content="Workers apply a multiplier to output.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Worker</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.workerId ?? 'Not set'}</div>
              </div>
            </Tooltip>
            <Tooltip content="Modules improve output and reduce failures later.">
              <div className="rounded-lg border border-zinc-100 bg-white/60 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Modules</div>
                <div className="mt-0.5 font-mono text-zinc-800 dark:text-zinc-200">{s.setup.moduleIds.length ? s.setup.moduleIds.length.toLocaleString() : 'None'}</div>
              </div>
            </Tooltip>
          </div>

          {cycle ? (
            <div className="rounded-xl border border-zinc-100 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Progress</div>
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

