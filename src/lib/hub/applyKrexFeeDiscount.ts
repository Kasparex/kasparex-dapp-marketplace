import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KREXTier } from '@/lib/rewards/types';

/** Apply KREX tier fee discount to a base KAS amount (2 decimal places). */
export function applyKrexFeeDiscount(feeKas: number, tier: KREXTier): number {
  const pct = krexTierDiscountPercent(tier);
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(feeKas * (1 - clamped / 100) * 100) / 100;
}
