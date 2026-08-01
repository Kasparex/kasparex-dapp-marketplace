'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PricingSnapshot } from '@/lib/pricing/types';
import { PRICING_SNAPSHOT_TTL_MS } from '@/lib/pricing/types';
import { tickersForCurrencies } from '@/lib/pricing/registry';
import {
  aggressiveCacheGet,
  aggressiveCacheSet,
} from '@/lib/hub/aggressiveCache';

type CacheEntry = {
  snapshot: PricingSnapshot;
  fetchedAt: number;
  key: string;
};

/** Bump when FX source / shape changes so stale localStorage rates do not stick. */
const PRICING_CACHE_NS = 'pricing-snapshot-v3';

let memoryCache: CacheEntry | null = null;
let inflight: Promise<PricingSnapshot> | null = null;
let inflightKey: string | null = null;
let pricingEpoch = 0;
const pricingListeners = new Set<() => void>();

function notifyPricingListeners() {
  for (const listener of pricingListeners) listener();
}

function cacheKey(tickers: string[]): string {
  return tickers.slice().sort().join(',') || '_';
}

function storageKeyPattern(): string {
  return `kx.cache.v1:${PRICING_CACHE_NS}:`;
}

export function clearPricingSnapshotCache(tickers?: string[]): void {
  if (tickers) {
    const key = cacheKey(tickersForCurrencies(tickers));
    if (memoryCache?.key === key) memoryCache = null;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(`kx.cache.v1:${PRICING_CACHE_NS}:${key}`);
      } catch {
        /* ignore */
      }
    }
    return;
  }

  memoryCache = null;
  if (typeof window === 'undefined') return;
  try {
    const prefix = storageKeyPattern();
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

async function fetchSnapshot(tickers: string[], opts?: { bust?: boolean }): Promise<PricingSnapshot> {
  const params = new URLSearchParams();
  if (tickers.length) params.set('tickers', tickers.join(','));
  if (opts?.bust) params.set('_', String(Date.now()));
  const qs = params.toString();
  const res = await fetch(`/api/pricing/snapshot${qs ? `?${qs}` : ''}`, {
    cache: opts?.bust ? 'no-store' : 'default',
  });
  if (!res.ok) throw new Error('Pricing snapshot unavailable');
  return (await res.json()) as PricingSnapshot;
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

/**
 * Global Hub FX snapshot. Every Pay with / checkout surface should use this hook
 * (or `useHubPayWithCatalog`), not ad-hoc price fetches.
 */
export function usePricingSnapshot(tickers: string[]) {
  const normalized = useMemo(() => tickersForCurrencies(tickers), [tickers]);
  const key = useMemo(() => cacheKey(normalized), [normalized]);

  const [epoch, setEpoch] = useState(pricingEpoch);
  const [snapshot, setSnapshot] = useState<PricingSnapshot | null>(() => readCached(key));
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onBump = () => setEpoch(pricingEpoch);
    pricingListeners.add(onBump);
    return () => {
      pricingListeners.delete(onBump);
    };
  }, []);

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
  }, [key, normalized, epoch]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    clearPricingSnapshotCache();
    try {
      const next = await fetchSnapshot(normalized, { bust: true });
      writeCached(key, next);
      setSnapshot(next);
      pricingEpoch += 1;
      notifyPricingListeners();
      return next;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Pricing unavailable';
      setError(message);
      throw e instanceof Error ? e : new Error(message);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [key, normalized]);

  return { snapshot, isLoading, isRefreshing, error, refresh };
}
