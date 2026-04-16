'use client';

import { useEffect, useMemo, useState } from 'react';
import { createKnsClient } from '@/lib/kns/client';

export function useKnsPrimaryName(ownerKaspaAddress: string | null | undefined) {
  const owner = useMemo(() => {
    const raw = String(ownerKaspaAddress || '').trim();
    if (!raw) return null;
    return raw.toLowerCase();
  }, [ownerKaspaAddress]);

  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPrimaryName(null);
      if (!owner) return;
      setIsLoading(true);
      try {
        const kns = createKnsClient();
        const res = await kns.getPrimaryNameByOwner(owner);
        const name = (res?.primaryName || res?.primary_name || res?.domain || null) as string | null;
        if (!cancelled) setPrimaryName(name ? String(name).toLowerCase() : null);
      } catch {
        if (!cancelled) setPrimaryName(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [owner]);

  return { primaryName, isLoading };
}

