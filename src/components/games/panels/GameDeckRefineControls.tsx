'use client';

import type { ReactNode } from 'react';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';

/** Shared shell: fixed 32px box so input focus never grows past Max / Refine. */
const SHELL =
  'box-border inline-flex h-8 min-h-8 max-h-8 shrink-0 items-center rounded-lg border text-xs font-semibold leading-none';

const FIELD =
  `${SHELL} w-14 border-zinc-200 bg-white px-2 py-0 text-left tabular-nums font-medium text-zinc-900 outline-none ring-0 ` +
  'appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ' +
  'focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400';

const MAX_BTN =
  `${SHELL} border-zinc-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 ` +
  'hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800';

const REFINE_BTN =
  `${SHELL} border-emerald-600 bg-emerald-600 px-3 font-bold text-white hover:border-emerald-700 hover:bg-emerald-700 ` +
  'disabled:cursor-not-allowed disabled:opacity-50';

/** Compact amount + Max + Refine controls for Game Deck (does not auto-fill live balance). */
export function GameDeckRefineControls({
  amount,
  onAmountChange,
  minAmount = 1,
  maxAmount,
  refining,
  onRefine,
  disabled,
}: {
  amount: number | '';
  onAmountChange: (next: number | '') => void;
  minAmount?: number;
  maxAmount: number;
  refining?: boolean;
  onRefine: (amount: number) => void;
  disabled?: boolean;
}) {
  const n = typeof amount === 'number' ? amount : 0;
  const canRefine = !disabled && !refining && n >= minAmount && n <= maxAmount && maxAmount >= minAmount;

  return (
    <div className="flex h-8 flex-nowrap items-center justify-end gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        min={minAmount}
        max={Math.max(minAmount, maxAmount)}
        placeholder="0"
        value={amount === '' ? '' : amount}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onAmountChange('');
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          onAmountChange(Math.max(0, Math.floor(parsed)));
        }}
        className={FIELD}
        aria-label="Refine amount"
      />
      <button
        type="button"
        className={MAX_BTN}
        onClick={() => onAmountChange(Math.max(0, Math.floor(maxAmount)))}
      >
        Max
      </button>
      <button
        type="button"
        disabled={!canRefine}
        onClick={() => {
          if (typeof amount === 'number') onRefine(amount);
        }}
        className={REFINE_BTN}
      >
        {refining ? '…' : 'Refine'}
      </button>
    </div>
  );
}

export function gameDeckRefineResource(opts: {
  amount: number | '';
  onAmountChange: (next: number | '') => void;
  minAmount?: number;
  maxAmount: number;
  refining?: boolean;
  onRefine: (amount: number) => void;
  disabled?: boolean;
  description?: string;
}): GameDeckResource {
  const min = opts.minAmount ?? 1;
  return {
    id: 'refine',
    label: 'Refine to Hub',
    description: opts.description ?? `Min ${min} → Hub redeem points on /rewards`,
    tooltip:
      'Enter how many Diamonds to refine. Credits Hub redeem points on /rewards. Amount does not auto-follow your live balance.',
    value: (
      <GameDeckRefineControls
        amount={opts.amount}
        onAmountChange={opts.onAmountChange}
        minAmount={min}
        maxAmount={opts.maxAmount}
        refining={opts.refining}
        onRefine={opts.onRefine}
        disabled={opts.disabled}
      />
    ) as ReactNode,
  };
}
