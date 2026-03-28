import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { kasToSompi } from '@/lib/ads/config';

/**
 * Distinct list prices (KAS) for an ad campaign after applying each KREX shop discount tier.
 * Matches client pricing in CreateAdWizard (same formula as Diamond Veins garage).
 */
export function allowedAdPricesKasFromBase(baseKas: number): number[] {
  const discounts = new Set<number>([0, ...Object.values(KREX_TIER_SHOP_DISCOUNT_PCT)]);
  const prices = [...discounts].map((d) => Number((baseKas * (1 - d / 100)).toFixed(8)));
  return [...new Set(prices)].sort((a, b) => a - b);
}

/**
 * True when metadata price matches an allowed tier-discounted rate and paid sompi matches (±1 for float edge).
 */
export function isValidAdPayment(metaPriceKas: number, paidSompi: number, baseKas: number): boolean {
  if (baseKas <= 0 || metaPriceKas <= 0 || paidSompi <= 0) return false;
  const allowed = allowedAdPricesKasFromBase(baseKas);
  const priceOk = allowed.some((k) => Math.abs(k - metaPriceKas) < 1e-6);
  if (!priceOk) return false;
  const expectedSompi = kasToSompi(metaPriceKas);
  return expectedSompi === paidSompi || Math.abs(expectedSompi - paidSompi) <= 1;
}
