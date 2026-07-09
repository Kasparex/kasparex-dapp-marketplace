/**
 * Server-side KRC-20 spot prices in KAS from api.kaspa.com (no API key).
 */

import type { TokenPriceRate } from './types';

const KASPACOM_KRC20_BASE = 'https://api.kaspa.com/krc20';
const FETCH_TIMEOUT_MS = 12_000;

type KaspaComKrc20Row = {
  ticker?: string;
  price?: number;
};

async function fetchTickerPrice(tick: string): Promise<TokenPriceRate | null> {
  const normalized = tick.trim().toUpperCase();
  if (!normalized || normalized === 'KAS') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${KASPACOM_KRC20_BASE}/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Kasparex-Hub-Pricing/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as KaspaComKrc20Row;
    const kasPerToken = typeof json.price === 'number' && json.price > 0 ? json.price : null;
    if (kasPerToken == null) return null;

    const asOf = new Date().toISOString();
    return {
      tick: normalized,
      kind: 'market',
      kasPerToken,
      source: 'kaspa.com',
      asOf,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchKrc20KasPrices(tickers: string[]): Promise<TokenPriceRate[]> {
  const unique = Array.from(
    new Set(
      tickers
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t && t !== 'KAS'),
    ),
  );
  if (!unique.length) return [];

  const results = await Promise.all(unique.map((tick) => fetchTickerPrice(tick)));
  return results.filter((r): r is TokenPriceRate => r != null);
}
