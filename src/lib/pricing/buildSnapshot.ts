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

export async function buildPricingSnapshot(tickers: string[]): Promise<PricingSnapshot> {
  const asOf = new Date().toISOString();
  const normalized = normalizePricingTickers(tickers);

  const rates: Record<string, TokenPriceRate> = {
    KAS: kasNativeRate(asOf),
    KREX: krexFixedPegRate(asOf),
  };

  const marketRates = await fetchKrc20KasPrices(normalized);
  for (const rate of marketRates) {
    rates[rate.tick] = rate;
  }

  return { asOf, rates };
}
