'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdEntry } from '@/lib/ads/types';

export function useAdsRegistry() {
  const [ads, setAds] = useState<AdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_ADS_USE_MOCK === '1') {
        const { getAllActiveAds } = await import('@/lib/ads/mockAds');
        setAds(getAllActiveAds());
      } else {
        const r = await fetch('/api/ads/active', { cache: 'no-store' });
        const j = (await r.json()) as { ads?: AdEntry[] };
        setAds(Array.isArray(j.ads) ? j.ads : []);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ads, loading, error, refresh };
}
