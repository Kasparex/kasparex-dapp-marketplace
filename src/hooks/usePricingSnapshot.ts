'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { PRICING_SNAPSHOT_TTL_MS } from '@/lib/pricing/types';
import { tickersForCurrencies } from '@/lib/pricing/registry';
import { aggressiveCacheGet, aggressiveCacheSet } from '@/lib/hub/aggressiveCache';

type CacheEntry = {
  snapshot: PricingSnapshot;
  fetchedAt: number;
  key: string;
};

/** Bump when FX source / shape changes so stale localStorage pegs do not stick. */
const PRICING_CACHE_NS = 'pricing-snapshot-v2';

let memoryCache: CacheEntry | null = null;
let inflight: Promise<PricingSnapshot> | null = null;
let inflightKey: string | null = null;

async function fetchSnapshot(tickers: string[]): Promise<PricingSnapshot> {
  const params = new URLSearchParams();
  if (tickers.length) params.set('tickers', tickers.join(','));
  const qs = params.toString();
  const res = await fetch(`/api/pricing/snapshot${qs ? `?${qs}` : ''}`, {
    // Prefer CDN / browser cache; API returns long s-maxage.
    cache: 'force-cache',
  });
  if (!res.ok) throw new Error('Pricing snapshot unavailable');
  return (await res.json()) as PricingSnapshot;
}

function cacheKey(tickers: string[]): string {
  return tickers.slice().sort().join(',') || '_';
}

function readCached(key: string): PricingSnapshot | null {
  if (memoryCache && memoryCache.key === key && Date.now() - memoryCache.fetchedAt < PRICING_SNAPSHOT_TTL_MS) {
    return memoryCache.snapshot;
  }
  const fromStore = aggressiveCacheGet<PricingSnapshot>(PRICING_CACHE_NS, key, PRICING_SNAPSHOT_TTL_MS);
  if (fromStore) {
    memoryCache = { snapshot: fromStore, fetchedAt: Date.now(), key };
    return fromStore;
  }
  return null;
}

function writeCached(key: string, snapshot: PricingSnapshot): void {
  memoryCache = { snapshot, fetchedAt: Date.now(), key };
  aggressiveCacheSet(PRICING_CACHE_NS, key, snapshot);
}

export function usePricingSnapshot(tickers: string[]) {
  const normalized = useMemo(() => tickersForCurrencies(tickers), [tickers]);
  const key = useMemo(() => cacheKey(normalized), [normalized]);

  const [snapshot, setSnapshot] = useState<PricingSnapshot | null>(() => readCached(key));
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCached(key);
    if (cached) {
      setSnapshot(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!inflight || inflightKey !== key) {
          inflightKey = key;
          inflight = fetchSnapshot(normalized);
        }
        const next = await inflight;
        if (cancelled) return;
        writeCached(key, next);
        setSnapshot(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Pricing unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
        if (inflightKey === key) {
          inflight = null;
          inflightKey = null;
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [key, normalized]);

  return { snapshot, isLoading, error };
}
