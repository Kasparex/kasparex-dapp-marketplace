import type { DApp } from '@/lib/dapps';
import { computeEarnedHubPoints } from './hub-points';
import { HUB_EARN_POINTS, HUB_POINTS_MIN_SPEND_KAS } from './hub-earn-policy';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import type { KREXTier } from './types';

export const HUB_POINTS_MIN_SPEND_TOOLTIP = `Minimum ${HUB_POINTS_MIN_SPEND_KAS} KAS equivalent spend required to earn Hub Points on this action.`;

/** Whether the action spend qualifies for Hub Points (fixed-fee actions at or above minimum always qualify). */
export function qualifiesForHubPointsSpend(spendKas: number | null | undefined): boolean {
  if (spendKas == null || !Number.isFinite(spendKas)) return true;
  return spendKas >= HUB_POINTS_MIN_SPEND_KAS;
}

export function computeHubPointsForAction(args: {
  dapp: DApp;
  actionId: string;
  tier: KREXTier;
  spendKas?: number | null;
}): number {
  const base = getHubPointsBaseForAction(args.dapp, args.actionId);
  if (base <= 0) return 0;
  if (!qualifiesForHubPointsSpend(args.spendKas)) return 0;
  return computeEarnedHubPoints(base, args.tier);
}

export function hubPointsBaseForDisplay(dapp: DApp, actionId: string): number {
  return getHubPointsBaseForAction(dapp, actionId);
}
