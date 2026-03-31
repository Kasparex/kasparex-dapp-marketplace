import type { KREXTier } from '@/lib/rewards/types';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';

export const CHRONICLES_LB_MAX_KREX_DISCOUNT_PERCENT = 14;

function roundKas(value: number): number {
  return Math.max(0.01, Math.round(value * 100) / 100);
}

export function chroniclesLbEffectivePriceKas(baseKas: number, tier: KREXTier): number {
  const discount = Math.max(0, krexTierDiscountPercent(tier));
  return roundKas(baseKas * (1 - discount / 100));
}

export function chroniclesLbMinimumAcceptedKas(baseKas: number): number {
  return roundKas(baseKas * (1 - CHRONICLES_LB_MAX_KREX_DISCOUNT_PERCENT / 100));
}

