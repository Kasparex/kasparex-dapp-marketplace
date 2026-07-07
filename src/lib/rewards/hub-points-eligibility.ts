import type { DApp } from '@/lib/dapps';
import { computeEarnedHubPoints } from './hub-points';
import { HUB_EARN_POINTS, HUB_POINTS_MIN_SPEND_KAS } from './hub-earn-policy';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import type { KREXTier } from './types';

export const HUB_POINTS_MIN_SPEND_TOOLTIP = `Minimum original transaction value of ${HUB_POINTS_MIN_SPEND_KAS} KAS (before KREX tier discounts) required to earn Hub Points on this action.`;

/** Whether the original (pre-discount) transaction value qualifies for Hub Points. */
export function qualifiesForHubPointsSpend(baseSpendKas: number | null | undefined): boolean {
  if (baseSpendKas == null || !Number.isFinite(baseSpendKas)) return true;
  return baseSpendKas >= HUB_POINTS_MIN_SPEND_KAS;
}

/** Hub Points earned at tier (display value; eligibility is separate). */
export function computeHubPointsForAction(args: {
  dapp: DApp;
  actionId: string;
  tier: KREXTier;
}): number {
  const base = getHubPointsBaseForAction(args.dapp, args.actionId);
  if (base <= 0) return 0;
  return computeEarnedHubPoints(base, args.tier);
}

export function hubPointsBaseForDisplay(dapp: DApp, actionId: string): number {
  return getHubPointsBaseForAction(dapp, actionId);
}

export { HUB_EARN_POINTS, HUB_POINTS_MIN_SPEND_KAS };
