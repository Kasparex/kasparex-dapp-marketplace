'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdEntry } from '@/lib/ads/types';
import { mergeActiveAdEntries } from '@/lib/ads/adActiveWindow';
import { readPersistedActiveAds, writePersistedActiveAds } from '@/lib/ads/clientAdsPersistence';

function mergeAdList(prev: AdEntry[], entry: AdEntry): AdEntry[] {
  return mergeActiveAdEntries([entry], prev);
}

export function useAdsRegistry() {
  const [ads, setAds] = useState<AdEntry[]>(() => readPersistedActiveAds());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commitAds = useCallback((next: AdEntry[]) => {
    writePersistedActiveAds(next);
    setAds(next);
  }, []);

  const upsertAd = useCallback(
    (entry: AdEntry) => {
      setAds((prev) => {
        const next = mergeAdList(prev, entry);
        writePersistedActiveAds(next);
        return next;
      });
    },
    [],
  );

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);
      try {
        if (process.env.NEXT_PUBLIC_ADS_USE_MOCK === '1') {
          const { getAllActiveAds } = await import('@/lib/ads/mockAds');
          commitAds(getAllActiveAds());
        } else {
          const r = await fetch(`/api/ads/active?_=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          });
          const j = (await r.json()) as { ads?: AdEntry[] };
          const serverAds = Array.isArray(j.ads) ? j.ads : [];
          setAds((prev) => {
            const next = mergeActiveAdEntries(serverAds, prev);
            writePersistedActiveAds(next);
            return next;
          });
        }
        setError(null);
      } catch (e) {
        if (!silent) setError(e instanceof Error ? e.message : 'Failed to load ads');
        if (!silent) {
          const persisted = readPersistedActiveAds();
          if (persisted.length > 0) setAds(persisted);
          else setAds([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [commitAds],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ads, loading, error, refresh, upsertAd };
}
