'use client';

import type { PlantSlotState } from '@/lib/game/minecore';

const BTN_BASE =
  'k-cta-games inline-flex shrink-0 items-center justify-center rounded-xl font-bold shadow-sm transition-opacity disabled:pointer-events-none disabled:opacity-40 disabled:grayscale';

export type MinecoreBulkMiningButtonProps =
  | {
      variant: 'mining-toolbar';
      plantSlots: PlantSlotState[];
      miningAllowed: boolean;
      onStartAll: () => void;
      /** Pause active runs (`StopMining`, same as each card’s Stop mining). */
      onPauseAll: () => void;
      onResumeAll: () => void;
      compact?: boolean;
    }
  | {
      variant: 'redeem-start-all';
      plantSlots: PlantSlotState[];
      miningAllowed: boolean;
      onStartAll: () => void;
    };

export function MinecoreBulkMiningButton(props: MinecoreBulkMiningButtonProps) {
  if (props.variant === 'redeem-start-all') {
    const anyReady = props.plantSlots.some((p) => p.unlocked && p.status === 'ReadyToMine');
    const disabled = !props.miningAllowed || !anyReady;
    return (
      <button
        type="button"
        onClick={props.onStartAll}
        disabled={disabled}
        title={
          props.miningAllowed
            ? 'Start mining on every plant that is ready.'
            : 'Connect your Kaspa wallet to start mining.'
        }
        className={`${BTN_BASE} h-11 min-w-[12rem] px-5 text-xs uppercase tracking-wide`}
      >
        Start all mines
      </button>
    );
  }

  const { plantSlots, miningAllowed, onStartAll, onPauseAll, onResumeAll, compact } = props;

  const anyActive = plantSlots.some((p) => p.unlocked && p.status === 'MiningActive');
  const anyPaused = plantSlots.some((p) => p.unlocked && p.status === 'MiningPaused');
  const anyReady = plantSlots.some((p) => p.unlocked && p.status === 'ReadyToMine');

  let label: string;
  let onClick: () => void;
  let disabled: boolean;
  let title: string;

  if (anyActive) {
    label = 'Stop all mines';
    onClick = onPauseAll;
    disabled = false;
    title = 'Pause every plant that is actively mining (same as Stop mining on each card).';
  } else if (anyPaused) {
    label = 'Resume all mines';
    onClick = onResumeAll;
    disabled = false;
    title = 'Resume paused runs on every plant that can resume.';
  } else {
    label = 'Start all mines';
    onClick = onStartAll;
    disabled = !anyReady || !miningAllowed;
    title = miningAllowed
      ? 'Start mining on every plant that is ready.'
      : 'Connect your Kaspa wallet to start mining.';
  }

  const h = compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm';

  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${BTN_BASE} ${h}`}>
      {label}
    </button>
  );
}
