'use client';

import { Tooltip } from '@/components/ui/Tooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { PlantSlotState } from '@/lib/game/minecore';

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
  onTopUp: () => void;
  onRepair: () => void;
  onQuickSetup: () => void;
}) {
  const s = props.slot;
  const now = Date.now();

  const cycle = s.cycle;
  const progress = cycle ? clamp01((now - cycle.startAtMs) / Math.max(1, cycle.endAtMs - cycle.startAtMs)) : 0;
  const remainingMs = cycle ? Math.max(0, cycle.endAtMs - now) : 0;

  const capsuleClass =
    'inline-flex items-center justify-between gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 dark:hover:bg-zinc-800/50';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Plant slot {s.index + 1}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={statusBadge(s.status)}>{labelForStatus(s.status)}</span>
            {s.unlocked ? (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Power {s.powerRemaining.toLocaleString()}</span>
            ) : (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Unlock {s.unlockCostKas.toLocaleString()} KAS</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <DiamondIcon className="h-4 w-4 text-sky-400" />
            Expected
          </div>
          <div className="mt-1 font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {cycle ? cycle.expectedDiamonds.toLocaleString() : '0'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Tooltip content="Install a machine to set cycle duration and base output.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Machine</span>
            <span className="font-mono text-xs">{s.setup.machineId ? s.setup.machineId : 'Not set'}</span>
          </button>
        </Tooltip>
        <Tooltip content="Power enables a cycle. Better batteries increase efficiency later.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Power</span>
            <span className="font-mono text-xs">{s.setup.batteryId ? s.setup.batteryId : 'Not set'}</span>
          </button>
        </Tooltip>
        <Tooltip content="Workers apply a multiplier to diamond output.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Workers</span>
            <span className="font-mono text-xs">{s.setup.workerId ? s.setup.workerId : 'Not set'}</span>
          </button>
        </Tooltip>
        <Tooltip content="Modules improve output and stability in later versions.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Modules</span>
            <span className="font-mono text-xs">{s.setup.moduleIds.length ? s.setup.moduleIds.length.toLocaleString() : 'None'}</span>
          </button>
        </Tooltip>
        <Tooltip content="Boosts are powered by KREX, KAS overclock, or GRID efficiency rules.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Boost</span>
            <span className="font-mono text-xs">{s.setup.boostId === 'none' ? 'None' : s.setup.boostId}</span>
          </button>
        </Tooltip>
        <Tooltip content="Ingredients are consumed in Fabrication to craft parts. V1 is instant craft.">
          <button type="button" className={capsuleClass}>
            <span className="font-semibold">Ingredients</span>
            <span className="font-mono text-xs">View</span>
          </button>
        </Tooltip>
      </div>

      {cycle ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cycle progress</div>
            <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{formatDuration(remainingMs)} left</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!s.unlocked ? (
          <Tooltip content="Unlock is paid with KAS (wired through the global payments SDK).">
            <button type="button" onClick={props.onUnlock} className="k-cta-games h-11 px-6 text-sm">
              Unlock
            </button>
          </Tooltip>
        ) : null}

        {s.unlocked && s.status === 'SetupIncomplete' ? (
          <button type="button" onClick={props.onQuickSetup} className="k-cta-games h-11 px-6 text-sm">
            Quick setup
          </button>
        ) : null}

        {s.unlocked && s.status === 'ReadyToMine' ? (
          <button type="button" onClick={props.onStart} className="k-cta-games h-11 px-6 text-sm">
            Start
          </button>
        ) : null}

        {s.unlocked && s.status === 'ExtractionReady' ? (
          <button type="button" onClick={props.onExtract} className="k-cta-games h-11 px-6 text-sm">
            Extract
          </button>
        ) : null}

        {s.unlocked && s.status === 'NeedsPower' ? (
          <Tooltip content="V1 mock. Power top-up will later charge KAS or consume Energy Cells.">
            <button type="button" onClick={props.onTopUp} className="k-cta-games h-11 px-6 text-sm">
              Top up power
            </button>
          </Tooltip>
        ) : null}

        {s.unlocked && s.status === 'NeedsRepair' ? (
          <button type="button" onClick={props.onRepair} className="k-cta-games h-11 px-6 text-sm">
            Repair
          </button>
        ) : null}

        {s.unlocked && s.status === 'MiningActive' ? (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Mining active</span>
        ) : null}
      </div>
    </div>
  );
}

