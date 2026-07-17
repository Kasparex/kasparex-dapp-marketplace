'use client';

import type { ClaimWindowProgress } from '@/lib/covenant/claimWindow';

const PHASE_BAR: Record<ClaimWindowProgress['phase'], string> = {
  locking: 'bg-[#02abb8]',
  claimable: 'bg-emerald-500',
  expired: 'bg-amber-500',
  done: 'bg-zinc-400 dark:bg-zinc-500',
};

const PHASE_TITLE: Record<ClaimWindowProgress['phase'], string> = {
  locking: 'Until unlock',
  claimable: 'Claim window',
  expired: 'Past deadline',
  done: 'Closed',
};

export function CovenantClaimWindowBar({
  progress,
}: {
  progress: ClaimWindowProgress;
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>{PHASE_TITLE[progress.phase]}</span>
        <span className="shrink-0 tabular-nums">
          {progress.label}
          {progress.phase === 'locking' || progress.phase === 'claimable'
            ? ` · ${progress.percent}%`
            : ''}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${PHASE_BAR[progress.phase]}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{progress.detail}</p>
    </div>
  );
}
