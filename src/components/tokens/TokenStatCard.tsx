'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { KX_METADATA_STAT_CARD } from '@/lib/hub/shellTokens';

/** Mining-tab / Tokens Overview summary card (shared Hub metadata box style). */
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
    <div className={`${KX_METADATA_STAT_CARD} ${className}`.trim()}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
        {tooltipTitle && tooltipDescription ? (
          <Tooltip content={gameTooltipRich(tooltipTitle, tooltipDescription)}>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              aria-label={`About ${tooltipTitle}`}
            >
              ?
            </button>
          </Tooltip>
        ) : null}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${valueClassName}`}>
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}
