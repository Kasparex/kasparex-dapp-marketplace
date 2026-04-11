'use client';

import { useEffect, useMemo, useState } from 'react';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export function CampaignEndCountdown({
  deadlineSec,
  compact = false,
  className = '',
  /** When `compact`, still show the “last 7 days” time bar (e.g. summary panel). */
  showTimeProgressBar = false,
  /** Tailwind classes for the time bar fill (funding bar uses emerald elsewhere). */
  timeProgressFillClassName = 'bg-emerald-500',
}: {
  /** Unix seconds */
  deadlineSec: bigint | number;
  compact?: boolean;
  className?: string;
  showTimeProgressBar?: boolean;
  timeProgressFillClassName?: string;
}) {
  const deadlineMs = useMemo(() => Number(deadlineSec) * 1000, [deadlineSec]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = deadlineMs - now;
  const ended = remainingMs <= 0;

  const parts = useMemo(() => {
    if (ended) return { d: 0, h: 0, m: 0, s: 0 };
    const sec = Math.floor(remainingMs / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { d, h, m, s };
  }, [ended, remainingMs]);

  /** Last 7 days before deadline: bar shrinks as the end approaches (full when more than 7 days remain). */
  const windowMs = 7 * 86400 * 1000;
  const timeBarPct = ended ? 100 : Math.min(100, Math.max(0, (remainingMs / windowMs) * 100));

  if (ended) {
    return (
      <div className={className}>
        <p className={compact ? 'text-xs font-semibold text-zinc-600 dark:text-zinc-400' : 'text-sm font-semibold text-zinc-700 dark:text-zinc-300'}>
          Campaign ended
        </p>
        {(!compact || showTimeProgressBar) && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div className="h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-500" />
          </div>
        )}
      </div>
    );
  }

  const label = compact
    ? `${parts.d > 0 ? `${parts.d}d ` : ''}${pad2(parts.h)}:${pad2(parts.m)}:${pad2(parts.s)} left`
    : `${parts.d}d ${pad2(parts.h)}:${pad2(parts.m)}:${pad2(parts.s)}`;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={compact ? 'text-xs text-zinc-600 dark:text-zinc-400' : 'text-sm text-zinc-600 dark:text-zinc-400'}>
          {compact ? 'Time left' : 'Time until end'}
        </p>
        <p
          className={
            compact
              ? 'text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300 tabular-nums'
              : 'text-base font-mono font-bold text-emerald-800 dark:text-emerald-300 tabular-nums'
          }
        >
          {label}
        </p>
      </div>
      {(!compact || showTimeProgressBar) && (
        <div className="mt-2 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${timeProgressFillClassName}`}
            style={{ width: `${timeBarPct}%` }}
          />
        </div>
      )}
      {(!compact || showTimeProgressBar) && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
          Bar shows the last week before the deadline (full when more than 7 days remain).
        </p>
      )}
    </div>
  );
}
