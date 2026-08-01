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
  };

  // Fetch market rates for listed ticks, but never for KREX: Hub settlement always uses the Minecore peg.
  const toFetch = normalizePricingTickers(normalized).filter((tick) => tick !== 'KREX');
  if (toFetch.length > 0) {
    const marketRates = await fetchKrc20KasPrices(toFetch);
    for (const rate of marketRates) {
      if (rate.tick === 'KREX') continue;
      rates[rate.tick] = rate;
    }
  }

  rates.KREX = krexFixedPegRate(asOf);

  return { asOf, rates };
}
