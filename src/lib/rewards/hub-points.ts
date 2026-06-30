import { KREX_TIERS, type KREXTier } from './types';

export function getHubPointsMultiplier(tier: KREXTier): number {
  return KREX_TIERS[tier]?.pointsMultiplier ?? 1;
}

export function getKrexFeeDiscountPercent(tier: KREXTier): number {
  return KREX_TIERS[tier]?.feeDiscountPercent ?? 0;
}

/** Base hub points multiplied by the user's KREX tier (1x base below 1M KREX). */
export function computeEarnedHubPoints(basePoints: number, tier: KREXTier): number {
  const mult = getHubPointsMultiplier(tier);
  if (!Number.isFinite(basePoints) || basePoints <= 0 || mult <= 0) return 0;
  return Math.floor(basePoints * mult);
}

export function formatHubPointsTierLabel(tier: KREXTier): string {
  if (tier === 'Tier0') return 'Base';
  return `${getHubPointsMultiplier(tier)}x`;
}

export const KREX_TIER_PERKS_ROWS = [
  { thresholdLabel: '< 1M KREX', tier: 'Tier0' as KREXTier, feeDiscountPercent: 0, pointsMultiplier: 1 },
  { thresholdLabel: '1M+ KREX', tier: 'Tier1' as KREXTier, feeDiscountPercent: 2, pointsMultiplier: 1 },
  { thresholdLabel: '10M+ KREX', tier: 'Tier2' as KREXTier, feeDiscountPercent: 5, pointsMultiplier: 2 },
  { thresholdLabel: '50M+ KREX', tier: 'Tier3' as KREXTier, feeDiscountPercent: 50, pointsMultiplier: 3 },
  { thresholdLabel: '100M+ KREX', tier: 'Tier4' as KREXTier, feeDiscountPercent: 80, pointsMultiplier: 4 },
] as const;
