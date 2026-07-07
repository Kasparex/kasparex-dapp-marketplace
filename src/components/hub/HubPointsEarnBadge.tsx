'use client';

import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import {
  HUB_POINTS_MIN_SPEND_TOOLTIP,
  qualifiesForHubPointsSpend,
} from '@/lib/rewards/hub-points-eligibility';
import type { KREXTier } from '@/lib/rewards/types';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

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
  baseSpendKas,
  spendKas,
  className = '',
  size = 'sm',
  showMinSpendTooltip = true,
}: {
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  /** Original transaction value before KREX discounts (for minimum spend eligibility). */
  baseSpendKas?: number | null;
  /** @deprecated Use baseSpendKas */
  spendKas?: number | null;
  className?: string;
  size?: 'sm' | 'md';
  showMinSpendTooltip?: boolean;
}) {
  const originalSpend = baseSpendKas ?? spendKas;
  const rawEarned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  if (rawEarned <= 0) return null;

  const eligible =
    originalSpend == null ||
    !Number.isFinite(originalSpend) ||
    qualifiesForHubPointsSpend(originalSpend);
  const sizeClass = size === 'md' ? 'text-sm gap-1.5' : 'text-xs gap-1';
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const colorClass = eligible
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-zinc-400 dark:text-zinc-500';

  const badge = (
    <span
      className={`inline-flex cursor-help items-center font-bold tabular-nums ${colorClass} ${sizeClass} ${className}`.trim()}
    >
      <HubPointsLightningIcon className={`${iconClass} shrink-0`} />
      +{rawEarned} pts
    </span>
  );

  if (!showMinSpendTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip content={HUB_POINTS_MIN_SPEND_TOOLTIP}>{badge}</Tooltip>
    </TooltipProvider>
  );
}

export function HubPointsEarnRow({
  label = 'Earn:',
  basePoints,
  tier,
  points,
  baseSpendKas,
  spendKas,
  className = '',
}: {
  label?: string;
  basePoints?: number;
  tier?: KREXTier;
  points?: number;
  baseSpendKas?: number | null;
  spendKas?: number | null;
  className?: string;
}) {
  const rawEarned =
    points ??
    (basePoints != null && tier != null ? computeEarnedHubPoints(basePoints, tier) : 0);
  if (rawEarned <= 0) return null;

  return (
    <div className={`flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 ${className}`.trim()}>
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <HubPointsEarnBadge points={rawEarned} baseSpendKas={baseSpendKas ?? spendKas} />
    </div>
  );
}
