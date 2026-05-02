'use client';

import type { PlantSlotState } from '@/lib/game/minecore';

export function MinecoreBulkMiningButton(props: {
  plantSlots: PlantSlotState[];
  miningAllowed: boolean;
  onStartAll: () => void;
  onStopAll: () => void;
  compact?: boolean;
}) {
  const { plantSlots, miningAllowed, onStartAll, onStopAll, compact } = props;

  const anyActive = plantSlots.some((p) => p.unlocked && p.status === 'MiningActive');
  const anyReady = plantSlots.some((p) => p.unlocked && p.status === 'ReadyToMine');

  const primaryIsStop = anyActive;
  const label = primaryIsStop ? 'Stop all mines' : 'Start all mines';
  const disabled = primaryIsStop ? false : !anyReady || !miningAllowed;

  const h = compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm';

  return (
    <button
      type="button"
      onClick={() => (primaryIsStop ? onStopAll() : onStartAll())}
      disabled={disabled}
      title={
        primaryIsStop
          ? 'Pause active runs on every plant that is currently mining.'
          : miningAllowed
            ? 'Start mining on every plant that is ready (wallet-connected profile).'
            : 'Connect your Kaspa wallet to start mining.'
      }
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 ${h}`}
    >
      {label}
    </button>
  );
}
