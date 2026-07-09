'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { PRICING_SNAPSHOT_TTL_MS } from '@/lib/pricing/types';
import { tickersForCurrencies } from '@/lib/pricing/registry';

type CacheEntry = {
  snapshot: PricingSnapshot;
  fetchedAt: number;
  key: string;
};

let memoryCache: CacheEntry | null = null;
let inflight: Promise<PricingSnapshot> | null = null;
let inflightKey: string | null = null;

async function fetchSnapshot(tickers: string[]): Promise<PricingSnapshot> {
  const params = new URLSearchParams();
  if (tickers.length) params.set('tickers', tickers.join(','));
  const qs = params.toString();
  const res = await fetch(`/api/pricing/snapshot${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Pricing snapshot unavailable');
  return (await res.json()) as PricingSnapshot;
}

function cacheKey(tickers: string[]): string {
  return tickers.slice().sort().join(',');
}

export function usePricingSnapshot(tickers: string[]) {
  const normalized = useMemo(() => tickersForCurrencies(tickers), [tickers]);
  const key = useMemo(() => cacheKey(normalized), [normalized]);

  const [snapshot, setSnapshot] = useState<PricingSnapshot | null>(() => {
    if (memoryCache && memoryCache.key === key && Date.now() - memoryCache.fetchedAt < PRICING_SNAPSHOT_TTL_MS) {
      return memoryCache.snapshot;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memoryCache && memoryCache.key === key && Date.now() - memoryCache.fetchedAt < PRICING_SNAPSHOT_TTL_MS) {
      setSnapshot(memoryCache.snapshot);
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
        memoryCache = { snapshot: next, fetchedAt: Date.now(), key };
        setSnapshot(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Pricing unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
        inflight = null;
        inflightKey = null;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [key, normalized]);

  return { snapshot, isLoading, error };
}
