'use client';

import { useEffect, useMemo, useState } from 'react';
import { createInsClient, type InsOwnedName } from '@/lib/ins/client';
import { isInsEnabled } from '@/lib/ins/config';
import { isInsNameExpiringSoon, normalizeEvmAddress } from '@/lib/ins/utils';

export function useInsOwnedNames(
  evmAddress: string | null | undefined,
  opts?: { enabled?: boolean },
) {
  const owner = useMemo(() => {
    const raw = normalizeEvmAddress(String(evmAddress || ''));
    if (!raw.startsWith('0x')) return null;
    return raw;
  }, [evmAddress]);

  const enabled = opts?.enabled !== false && isInsEnabled() && Boolean(owner);

  const [names, setNames] = useState<InsOwnedName[]>([]);
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setNames([]);
      setPrimaryName(null);
      if (!enabled || !owner) return;
      setIsLoading(true);
      try {
        const ins = createInsClient();
        const [owned, reverse] = await Promise.all([
          ins.getNamesByOwner(owner),
          ins.getPrimaryNameByOwner(owner),
        ]);
        if (cancelled) return;
        setNames(owned);
        setPrimaryName(reverse?.primary ? String(reverse.primary).toLowerCase() : null);
      } catch {
        if (!cancelled) {
          setNames([]);
          setPrimaryName(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, owner]);

  const expiringSoon = useMemo(() => {
    return names.filter((n) => isInsNameExpiringSoon(n.expires_at, n.tenure));
  }, [names]);

  return { names, primaryName, isLoading, expiringSoon };
}
