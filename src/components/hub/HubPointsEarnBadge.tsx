'use client';

import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import type { KREXTier } from '@/lib/rewards/types';

/** Standard Hub lightning icon used for points labels across the Hub. */
export function HubPointsLightningIcon({ className = 'h-3.5 w-3.5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

/** Standard Hub Points earn label (+N pts) used across the Hub. */
export function HubPointsEarnBadge({
  basePoints,
  tier,
  points,
  className = '',
  size = 'sm',
}: {
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const earned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  if (earned <= 0) return null;

  const sizeClass = size === 'md' ? 'text-sm gap-1.5' : 'text-xs gap-1';
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span
      className={`inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ${sizeClass} ${className}`.trim()}
    >
      <HubPointsLightningIcon className={`${iconClass} shrink-0`} />
      +{earned} pts
    </span>
  );
}

export function HubPointsEarnRow({
  label = 'Earn:',
  basePoints,
  tier,
  points,
  className = '',
}: {
  label?: string;
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  className?: string;
}) {
  const earned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  if (earned <= 0) return null;

  return (
    <div className={`flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 ${className}`.trim()}>
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <HubPointsEarnBadge points={earned} />
    </div>
  );
}
