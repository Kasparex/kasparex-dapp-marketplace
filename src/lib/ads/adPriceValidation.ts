import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { minecoreKrexFromDiscountedKas } from '@/lib/game/minecore/config';
import { kasToSompi } from '@/lib/ads/config';
import { ADS_FEATURED_HIGHLIGHT_KAS, ADS_KREX_BINDING_FEE_KAS } from '@/lib/ads/constants';

/**
 * Distinct totals (KAS) for an ad: tier-discounted slot portion + optional flat featured add-on.
 */
export function allowedAdTotalsKasFromSlotBase(slotBaseKas: number, featuredHighlight: boolean): number[] {
  if (slotBaseKas <= 0) return [];
  const addon = featuredHighlight ? ADS_FEATURED_HIGHLIGHT_KAS : 0;
  const discounts = new Set<number>([0, ...Object.values(KREX_TIER_SHOP_DISCOUNT_PCT)]);
  const prices = [...discounts].map((d) =>
    Number((slotBaseKas * (1 - d / 100) + addon).toFixed(8)),
  );
  return [...new Set(prices)].sort((a, b) => a - b);
}

/** Legacy helper — slot-only base (no featured add-on). */
export function allowedAdPricesKasFromBase(baseKas: number): number[] {
  return allowedAdTotalsKasFromSlotBase(baseKas, false);
}

export function expectedPriceKrexFromTotalKas(totalKas: number): number {
  if (!Number.isFinite(totalKas) || totalKas <= 0) return 0;
  return minecoreKrexFromDiscountedKas(totalKas);
}

function metaPriceMatchesSlotBase(
  metaPriceKas: number,
  slotBaseKas: number,
  featuredHighlight: boolean,
): boolean {
  if (slotBaseKas <= 0 || metaPriceKas <= 0) return false;
  const allowed = allowedAdTotalsKasFromSlotBase(slotBaseKas, featuredHighlight);
  return allowed.some((k) => Math.abs(k - metaPriceKas) < 1e-6);
}

export function isValidAdPriceMeta(
  metaPriceKas: number,
  slotBaseKas: number,
  featuredHighlight: boolean | undefined,
): boolean {
  const featured = featuredHighlight === true;
  return metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, featured);
}

function krexMetaMatchesPeg(metaPriceKas: number, metaPriceKrex: number): boolean {
  if (!Number.isFinite(metaPriceKrex) || metaPriceKrex <= 0) return false;
  const peg = expectedPriceKrexFromTotalKas(metaPriceKas);
  const expSmallest = Math.floor(peg * 1e8);
  const metaSmallest = Math.floor(metaPriceKrex * 1e8);
  return Math.abs(expSmallest - metaSmallest) <= 2;
}

/**
 * Full native-KAS settlement: metadata total must match tier + featured rules; treasury sompi must match total.
 */
export function isValidAdKasPayment(
  metaPriceKas: number,
  paidSompi: number,
  slotBaseKas: number,
  featuredHighlight: boolean | undefined,
): boolean {
  if (paidSompi <= 0) return false;
  const featured = featuredHighlight === true;
  if (!metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, featured)) return false;
  const expectedSompi = kasToSompi(metaPriceKas);
  return expectedSompi === paidSompi || Math.abs(expectedSompi - paidSompi) <= 1;
}

/**
 * KREX creative fee + small binding KAS carrying payload: binding sompi must meet minimum; KREX transfer verified separately.
 */
export function isValidAdKrexBindingKasPaid(paidSompi: number): boolean {
  const minSompi = kasToSompi(ADS_KREX_BINDING_FEE_KAS);
  return paidSompi >= minSompi || Math.abs(paidSompi - minSompi) <= 1;
}

export function isValidAdKrexPriceMeta(
  metaPriceKas: number,
  metaPriceKrex: number,
  slotBaseKas: number,
  featuredHighlight: boolean | undefined,
): boolean {
  const featured = featuredHighlight === true;
  if (!metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, featured)) return false;
  return krexMetaMatchesPeg(metaPriceKas, metaPriceKrex);
}

/**
 * @deprecated Use isValidAdKasPayment / KREX helpers — kept for older imports if any.
 */
export function isValidAdPayment(metaPriceKas: number, paidSompi: number, baseKas: number): boolean {
  return isValidAdKasPayment(metaPriceKas, paidSompi, baseKas, false);
}
