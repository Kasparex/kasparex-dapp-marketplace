import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { MINECORE_KREX_PER_KAS, minecoreKrexFromDiscountedKas } from '@/lib/game/minecore/config';
import { kasToSompi } from '@/lib/ads/config';
import { ADS_KREX_BINDING_FEE_KAS } from '@/lib/ads/constants';
import { adPremiumAddonKas, type AdPremiumOptions } from '@/lib/ads/premiumAddons';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { PricingSnapshot } from '@/lib/pricing/types';

/**
 * Distinct totals (KAS) for an ad: tier-discounted slot portion + optional flat premium add-ons.
 */
export function allowedAdTotalsKasFromSlotBase(slotBaseKas: number, premium: AdPremiumOptions): number[] {
  if (slotBaseKas <= 0) return [];
  const addon = adPremiumAddonKas(premium);
  const discounts = new Set<number>([0, ...Object.values(KREX_TIER_SHOP_DISCOUNT_PCT)]);
  const prices = [...discounts].map((d) =>
    Number((slotBaseKas * (1 - d / 100) + addon).toFixed(8)),
  );
  return [...new Set(prices)].sort((a, b) => a - b);
}

/** Legacy helper - slot-only base (no premium add-ons). */
export function allowedAdPricesKasFromBase(baseKas: number): number[] {
  return allowedAdTotalsKasFromSlotBase(baseKas, {});
}

export function expectedPriceKrexFromTotalKas(
  totalKas: number,
  snapshot?: PricingSnapshot | null,
): number {
  if (!Number.isFinite(totalKas) || totalKas <= 0) return 0;
  return resolveTokenAmountFromKas(totalKas, 'KREX', snapshot);
}

function metaPriceMatchesSlotBase(
  metaPriceKas: number,
  slotBaseKas: number,
  premium: AdPremiumOptions,
): boolean {
  if (slotBaseKas <= 0 || metaPriceKas <= 0) return false;
  const allowed = allowedAdTotalsKasFromSlotBase(slotBaseKas, premium);
  return allowed.some((k) => Math.abs(k - metaPriceKas) < 1e-6);
}

export function premiumOptionsFromMeta(meta: {
  featuredHighlight?: boolean;
  extendedExposure?: boolean;
}): AdPremiumOptions {
  return {
    featuredHighlight: meta.featuredHighlight === true,
    extendedExposure: meta.extendedExposure === true,
  };
}

export function isValidAdPriceMeta(
  metaPriceKas: number,
  slotBaseKas: number,
  premium: AdPremiumOptions,
): boolean {
  return metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, premium);
}

function krexMetaMatchesPeg(metaPriceKas: number, metaPriceKrex: number): boolean {
  if (!Number.isFinite(metaPriceKrex) || metaPriceKrex <= 0) return false;
  const peg = minecoreKrexFromDiscountedKas(metaPriceKas);
  const expSmallest = Math.floor(peg * 1e8);
  const metaSmallest = Math.floor(metaPriceKrex * 1e8);
  if (Math.abs(expSmallest - metaSmallest) <= 2) return true;

  const krexPerKas = metaPriceKrex / metaPriceKas;
  const pegKrexPerKas = MINECORE_KREX_PER_KAS;
  return krexPerKas >= pegKrexPerKas * 0.45 && krexPerKas <= pegKrexPerKas * 1.05;
}

/**
 * Full native-KAS settlement: metadata total must match tier + premium rules; treasury sompi must match total.
 */
export function isValidAdKasPayment(
  metaPriceKas: number,
  paidSompi: number,
  slotBaseKas: number,
  premium: AdPremiumOptions,
): boolean {
  if (paidSompi <= 0) return false;
  if (!metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, premium)) return false;
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
  premium: AdPremiumOptions,
): boolean {
  if (!metaPriceMatchesSlotBase(metaPriceKas, slotBaseKas, premium)) return false;
  return krexMetaMatchesPeg(metaPriceKas, metaPriceKrex);
}

/**
 * @deprecated Use isValidAdKasPayment / KREX helpers - kept for older imports if any.
 */
export function isValidAdPayment(metaPriceKas: number, paidSompi: number, baseKas: number): boolean {
  return isValidAdKasPayment(metaPriceKas, paidSompi, baseKas, {});
}
