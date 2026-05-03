'use client';

import type { ReactNode } from 'react';
import type { PlantSlotState } from '@/lib/game/minecore';
import { Tooltip } from '@/components/ui/Tooltip';

/** Game accent — matches {@link globals.css} `.k-cta-games` */
const BULK_MINING_BTN_CLASS =
  'k-cta-games inline-flex h-10 min-w-[10rem] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-wide disabled:pointer-events-none disabled:opacity-40';

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
        <button type="button" onClick={props.onStartAll} disabled={disabled} className={BULK_MINING_BTN_CLASS}>
          Start all mines
        </button>
      </WithTip>
    );
  }

  const { plantSlots, miningAllowed, onStartAll, onPauseAll, onResumeAll } = props;

  const anyActive = plantSlots.some((p) => p.unlocked && p.status === 'MiningActive');
  const anyPaused = plantSlots.some((p) => p.unlocked && p.status === 'MiningPaused');
  const anyReady = plantSlots.some((p) => p.unlocked && p.status === 'ReadyToMine');

  const primaryShowsStartAll = !anyActive && !anyPaused;

  let label: string;
  let primaryClick: () => void;
  let primaryDisabled: boolean;
  let primaryTip: string;

  if (anyActive) {
    label = 'Stop all mines';
    primaryClick = onPauseAll;
    primaryDisabled = false;
    primaryTip =
      'Pause every plant that is actively mining (same as Stop mining on each card). Battery and progress are preserved until you resume or the run ends.';
  } else if (anyPaused) {
    label = 'Resume all mines';
    primaryClick = onResumeAll;
    primaryDisabled = false;
    primaryTip = 'Resume paused runs on every plant that can resume (requirements still apply per plant).';
  } else {
    label = 'Start all mines';
    primaryClick = onStartAll;
    primaryDisabled = !anyReady || !miningAllowed;
    primaryTip = miningAllowed
      ? 'Start mining on every plant that is ready (requirements, power, crew, and caps still apply per plant).'
      : 'Connect your Kaspa L1 wallet to start mining.';
  }

  const startAllTip = miningAllowed
    ? 'Start mining on every plant that is ready (requirements, power, crew, and caps still apply per plant).'
    : 'Connect your Kaspa L1 wallet to start mining.';
  const startAllDisabled = !anyReady || !miningAllowed;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!primaryShowsStartAll ? (
        <>
          <WithTip tip={primaryTip}>
            <button type="button" onClick={primaryClick} disabled={primaryDisabled} className={BULK_MINING_BTN_CLASS}>
              {label}
            </button>
          </WithTip>
          <WithTip tip={startAllTip}>
            <button type="button" onClick={onStartAll} disabled={startAllDisabled} className={BULK_MINING_BTN_CLASS}>
              Start all mines
            </button>
          </WithTip>
        </>
      ) : (
        <WithTip tip={startAllTip}>
          <button type="button" onClick={onStartAll} disabled={startAllDisabled} className={BULK_MINING_BTN_CLASS}>
            Start all mines
          </button>
        </WithTip>
      )}
    </div>
  );
}
