'use client';

import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import type { KREXTier } from '@/lib/rewards/types';

/** Standard Hub Points earn label (⚡ +N pts) used across the Hub. */
export function HubPointsEarnBadge({
  basePoints,
  tier,
  points,
  className = '',
  size = 'sm',
}: {
  /** Base points before KREX tier multiplier. */
  basePoints?: number;
  tier?: KREXTier;
  /** Precomputed points (skips tier math when set). */
  points?: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const earned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  if (earned <= 0) return null;

  const sizeClass =
    size === 'md'
      ? 'text-sm gap-1.5'
      : 'text-xs gap-1';

  return (
    <span
      className={`inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ${sizeClass} ${className}`.trim()}
    >
      <span aria-hidden className={size === 'md' ? 'text-base' : 'text-sm'}>
        ⚡
      </span>
      +{earned} pts
    </span>
  );
}

export function HubPointsEarnRow({
  label = 'You will get:',
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
