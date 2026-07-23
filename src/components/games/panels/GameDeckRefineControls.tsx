'use client';

import type { ReactNode } from 'react';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';

const CTRL =
  'h-8 rounded-lg border border-zinc-200 bg-white text-xs font-semibold dark:border-zinc-600 dark:bg-zinc-950';

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
    <div className="flex flex-nowrap items-center justify-end gap-1.5">
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
        className={`${CTRL} w-14 px-1.5 text-right tabular-nums font-medium`}
        aria-label="Refine amount"
      />
      <button
        type="button"
        className={`${CTRL} px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800`}
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
        className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
