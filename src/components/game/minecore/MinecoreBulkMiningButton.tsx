'use client';

import type { ReactNode } from 'react';
import type { PlantSlotState } from '@/lib/game/minecore';
import { Tooltip } from '@/components/ui/Tooltip';

/** Matches {@link CardsFilterBar} category/sort triggers (h-10, text-sm, font-medium). */
const MINING_TOOLBAR_BTN_CLASS =
  'inline-flex h-10 min-w-[160px] shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900';

function WithTip(props: { tip: string; children: ReactNode }) {
  return (
    <Tooltip content={props.tip}>
      <span className="inline-flex max-w-full">{props.children}</span>
    </Tooltip>
  );
}

export type MinecoreBulkMiningButtonProps =
  | {
      variant: 'mining-toolbar';
      plantSlots: PlantSlotState[];
      miningAllowed: boolean;
      onStartAll: () => void;
      /** Pause active runs (`StopMining`, same as each card’s Stop mining). */
      onPauseAll: () => void;
      onResumeAll: () => void;
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
    const tip = props.miningAllowed
      ? 'Start mining on every plant that is ready (requirements and caps still apply per plant).'
      : 'Connect your Kaspa L1 wallet to start mining.';
    return (
      <WithTip tip={tip}>
        <button type="button" onClick={props.onStartAll} disabled={disabled} className={MINING_TOOLBAR_BTN_CLASS}>
          Start all mines
        </button>
      </WithTip>
    );
  }

  const { plantSlots, miningAllowed, onStartAll, onPauseAll, onResumeAll } = props;

  const anyActive = plantSlots.some((p) => p.unlocked && p.status === 'MiningActive');
  const anyPaused = plantSlots.some((p) => p.unlocked && p.status === 'MiningPaused');
  const anyReady = plantSlots.some((p) => p.unlocked && p.status === 'ReadyToMine');

  let label: string;
  let onClick: () => void;
  let disabled: boolean;
  let tip: string;

  if (anyActive) {
    label = 'Stop all mines';
    onClick = onPauseAll;
    disabled = false;
    tip =
      'Pause every plant that is actively mining (same as Stop mining on each card). Battery and progress are preserved until you resume or the run ends.';
  } else if (anyPaused) {
    label = 'Resume all mines';
    onClick = onResumeAll;
    disabled = false;
    tip = 'Resume paused runs on every plant that can resume (requirements still apply per plant).';
  } else {
    label = 'Start all mines';
    onClick = onStartAll;
    disabled = !anyReady || !miningAllowed;
    tip = miningAllowed
      ? 'Start mining on every plant that is ready (requirements, power, crew, and caps still apply per plant).'
      : 'Connect your Kaspa L1 wallet to start mining.';
  }

  return (
    <WithTip tip={tip}>
      <button type="button" onClick={onClick} disabled={disabled} className={MINING_TOOLBAR_BTN_CLASS}>
        {label}
      </button>
    </WithTip>
  );
}
