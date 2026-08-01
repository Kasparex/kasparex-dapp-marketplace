import { fetchKrc20KasPrices } from './fetchKrc20KasPrices';
import { kasNativeRate, krexFixedPegRate } from './fixedPegs';
import type { PricingSnapshot, TokenPriceRate } from './types';

export function normalizePricingTickers(tickers: string[]): string[] {
  return Array.from(
    new Set(
      tickers
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

/**
 * Hub pricing standard: every KRC-20 (including KREX) converts from a KAS base
 * using market `kasPerToken` when available. Minecore peg is KREX fallback only.
 */
export async function buildPricingSnapshot(tickers: string[]): Promise<PricingSnapshot> {
  const asOf = new Date().toISOString();
  const normalized = normalizePricingTickers(tickers);

  const rates: Record<string, TokenPriceRate> = {
    KAS: kasNativeRate(asOf),
  };

  const toFetch = normalizePricingTickers([...normalized, 'KREX']);
  const marketRates = await fetchKrc20KasPrices(toFetch);
  for (const rate of marketRates) {
    rates[rate.tick] = rate;
  }

  if (!rates.KREX) {
    rates.KREX = krexFixedPegRate(asOf);
  }

  return { asOf, rates };
}
