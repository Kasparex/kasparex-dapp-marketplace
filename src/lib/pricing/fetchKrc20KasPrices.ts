/**
 * Server-side KRC-20 spot prices in KAS.
 * Prefer KasLab (`price_kas`) so Hub Pay with matches https://kaspatoken.kaslab.space.
 * Fall back to api.kaspa.com, then caller may apply Minecore peg for KREX.
 */

import type { TokenPriceRate } from './types';

const KASLAB_TOKEN_BASE = 'https://kaspatoken.kaslab.space/api/token';
const KASPACOM_KRC20_BASE = 'https://api.kaspa.com/krc20';
const FETCH_TIMEOUT_MS = 12_000;

type KasLabTokenPayload = {
  data?: {
    symbol?: string;
    price_kas?: number;
  };
};

type KaspaComKrc20Row = {
  ticker?: string;
  price?: number;
};

async function fetchJson(
  url: string,
  signal: AbortSignal,
): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Kasparex-Hub-Pricing/1.1' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function rateFromKasPerToken(
  tick: string,
  kasPerToken: number,
  source: string,
  asOf: string,
): TokenPriceRate | null {
  if (!(kasPerToken > 0) || !Number.isFinite(kasPerToken)) return null;
  return {
    tick,
    kind: 'market',
    kasPerToken,
    source,
    asOf,
  };
}

async function fetchTickerPrice(tick: string): Promise<TokenPriceRate | null> {
  const normalized = tick.trim().toUpperCase();
  if (!normalized || normalized === 'KAS') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const asOf = new Date().toISOString();

  try {
    // KasLab slug is lowercase, e.g. krc20-krex (matches public Token Hub converters).
    const kaslabJson = (await fetchJson(
      `${KASLAB_TOKEN_BASE}/krc20-${encodeURIComponent(normalized.toLowerCase())}`,
      controller.signal,
    )) as KasLabTokenPayload | null;
    const kaslabPrice = kaslabJson?.data?.price_kas;
    const fromKaslab = rateFromKasPerToken(
      normalized,
      typeof kaslabPrice === 'number' ? kaslabPrice : NaN,
      'kaslab.space',
      asOf,
    );
    if (fromKaslab) return fromKaslab;

    const kaspaComJson = (await fetchJson(
      `${KASPACOM_KRC20_BASE}/${encodeURIComponent(normalized)}`,
      controller.signal,
    )) as KaspaComKrc20Row | null;
    const kaspaComPrice = kaspaComJson?.price;
    return rateFromKasPerToken(
      normalized,
      typeof kaspaComPrice === 'number' ? kaspaComPrice : NaN,
      'kaspa.com',
      asOf,
    );
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
