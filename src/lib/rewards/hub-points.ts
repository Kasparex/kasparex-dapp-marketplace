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

const KREX_TIER_THRESHOLD_LABELS: Record<KREXTier, string> = {
  Tier0: '< 1M KREX',
  Tier1: '1M+ KREX',
  Tier2: '10M+ KREX',
  Tier3: '50M+ KREX',
  Tier4: '100M+ KREX',
};

export const KREX_TIER_PERKS_ROWS = (['Tier0', 'Tier1', 'Tier2', 'Tier3', 'Tier4'] as const).map((tier) => ({
  thresholdLabel: KREX_TIER_THRESHOLD_LABELS[tier],
  tier,
  feeDiscountPercent: KREX_TIERS[tier].feeDiscountPercent,
  pointsMultiplier: KREX_TIERS[tier].pointsMultiplier,
}));
