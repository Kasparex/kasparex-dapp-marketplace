'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

/** Mining-tab style summary card used across Tokens Overview / Tokenomics. */
export function TokenStatCard(props: {
  label: string;
  value: ReactNode;
  hint?: string;
  tooltipTitle?: string;
  tooltipDescription?: string;
  valueClassName?: string;
  className?: string;
}) {
  const {
    label,
    value,
    hint,
    tooltipTitle,
    tooltipDescription,
    valueClassName = 'text-zinc-900 dark:text-zinc-100',
    className = '',
  } = props;

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 ${className}`.trim()}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
        {tooltipTitle && tooltipDescription ? (
          <Tooltip content={gameTooltipRich(tooltipTitle, tooltipDescription)}>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              aria-label={`About ${tooltipTitle}`}
            >
              ?
            </button>
          </Tooltip>
        ) : null}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${valueClassName}`}>{value}</div>
      {hint ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}
