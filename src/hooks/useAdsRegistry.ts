'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdEntry } from '@/lib/ads/types';

export function useAdsRegistry() {
  const [ads, setAds] = useState<AdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_ADS_USE_MOCK === '1') {
        const { getAllActiveAds } = await import('@/lib/ads/mockAds');
        setAds(getAllActiveAds());
      } else {
        const r = await fetch(`/api/ads/active?_=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const j = (await r.json()) as { ads?: AdEntry[] };
        setAds(Array.isArray(j.ads) ? j.ads : []);
      }
      setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load ads');
      if (!silent) setAds([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ads, loading, error, refresh };
}
