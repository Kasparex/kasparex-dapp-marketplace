'use client';

import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import {
  HUB_POINTS_MIN_SPEND_TOOLTIP,
  qualifiesForHubPointsSpend,
} from '@/lib/rewards/hub-points-eligibility';
import type { KREXTier } from '@/lib/rewards/types';

/** Global Hub Points earn display: lightning icon + emerald +N pts. Use this everywhere. */
export function HubPointsLightningIcon({ className = 'h-3.5 w-3.5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

/** Global Hub Points earn label (+N pts with lightning). Use HubPointsEarnRow in breakdown panels. */
export function HubPointsEarnBadge({
  basePoints,
  tier,
  points,
  spendKas,
  className = '',
  size = 'sm',
  showMinSpendTooltip = true,
}: {
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  /** When set, hides earn display if spend is below the 10 KAS minimum. */
  spendKas?: number | null;
  className?: string;
  size?: 'sm' | 'md';
  showMinSpendTooltip?: boolean;
}) {
  const rawEarned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  const belowMin = spendKas != null && !qualifiesForHubPointsSpend(spendKas);
  const earned = belowMin ? 0 : rawEarned;
  if (earned <= 0) return null;

  const sizeClass = size === 'md' ? 'text-sm gap-1.5' : 'text-xs gap-1';
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const tooltip = showMinSpendTooltip ? HUB_POINTS_MIN_SPEND_TOOLTIP : undefined;

  return (
    <span
      title={tooltip}
      className={`inline-flex cursor-help items-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ${sizeClass} ${className}`.trim()}
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
  spendKas,
  className = '',
}: {
  label?: string;
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  spendKas?: number | null;
  className?: string;
}) {
  const rawEarned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  const belowMin = spendKas != null && !qualifiesForHubPointsSpend(spendKas);
  const earned = belowMin ? 0 : rawEarned;
  if (earned <= 0) return null;

  return (
    <div className={`flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 ${className}`.trim()}>
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <HubPointsEarnBadge points={earned} spendKas={spendKas} />
    </div>
  );
}
