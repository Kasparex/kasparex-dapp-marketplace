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
        // KNS can run on mainnet or TN10; users may own domains on either.
        // Try current default first, then fall back to the other network.
        const defaultNet = createKnsClient().network;
        const candidates: Array<'mainnet' | 'tn10'> = [defaultNet, defaultNet === 'mainnet' ? 'tn10' : 'mainnet'];

        let found: string | null = null;
        for (const net of candidates) {
          const kns = createKnsClient({ network: net });
          const res = await kns.getPrimaryNameByOwner(owner);
          const name =
            ((res as any)?.domain?.fullName as string | undefined) ||
            ((res as any)?.domain?.full_name as string | undefined) ||
            ((res as any)?.primaryName as string | undefined) ||
            ((res as any)?.primary_name as string | undefined) ||
            ((res as any)?.domain as string | undefined) ||
            null;
          if (name) {
            found = String(name).toLowerCase();
            break;
          }
        }
        if (!cancelled) setPrimaryName(found);
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

