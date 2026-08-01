'use client';

import type { ReactNode } from 'react';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';

const ROW = 'flex h-8 flex-nowrap items-center justify-end gap-1.5';

const INPUT_WRAP = 'relative box-border inline-flex h-8 w-[5.75rem] shrink-0 items-center';

const INPUT =
  'no-k-style box-border h-8 w-full rounded-lg border border-zinc-300/50 bg-zinc-50 py-0 pl-2 pr-9 text-left text-xs font-medium tabular-nums leading-none text-zinc-900 outline-none ' +
  'appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ' +
  'focus:border-zinc-400/70 focus:outline-none focus:ring-0 dark:border-zinc-700/70 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-600';

const MAX_INSIDE =
  'absolute right-1 top-1/2 z-10 inline-flex h-6 -translate-y-1/2 items-center rounded px-1.5 text-[10px] font-bold uppercase tracking-wide ' +
  'bg-zinc-200/80 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600';

const REFINE_BTN =
  'box-border inline-flex h-8 shrink-0 items-center rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-xs font-bold leading-none text-white ' +
  'hover:border-emerald-700 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';

/** Compact amount + Max-inside + Refine for Game Deck (does not auto-fill live balance). */
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
    <div className={ROW}>
      <div className={INPUT_WRAP}>
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
          className={INPUT}
          aria-label="Refine amount"
        />
        <button
          type="button"
          className={MAX_INSIDE}
          onClick={() => onAmountChange(Math.max(0, Math.floor(maxAmount)))}
        >
          Max
        </button>
      </div>
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
  /** Override default Diamonds tooltip for other in-game currencies. */
  tooltip?: string;
}): GameDeckResource {
  const min = opts.minAmount ?? 1;
  return {
    id: 'refine',
    label: 'Refine to Hub',
    description: opts.description ?? `Min ${min} → Hub points`,
    tooltip:
      opts.tooltip ??
      'Enter how many Diamonds to refine. Each diamond credits exactly 1 Hub redeem point on /rewards. Amount does not auto-follow your live balance.',
    fullWidth: true,
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