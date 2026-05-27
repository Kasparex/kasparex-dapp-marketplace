'use client';

import { useEffect, useMemo, useState } from 'react';
import { createInsClient } from '@/lib/ins/client';
import { isInsEnabled } from '@/lib/ins/config';
import { normalizeEvmAddress } from '@/lib/ins/utils';

export function useInsPrimaryName(
  evmAddress: string | null | undefined,
  opts?: { enabled?: boolean; chainId?: number | null },
) {
  const owner = useMemo(() => {
    const raw = normalizeEvmAddress(String(evmAddress || ''));
    if (!raw.startsWith('0x')) return null;
    return raw;
  }, [evmAddress]);

  const enabled = opts?.enabled !== false && isInsEnabled() && Boolean(owner);

  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPrimaryName(null);
      if (!enabled || !owner) return;
      setIsLoading(true);
      try {
        const ins = createInsClient();
        const res = await ins.getPrimaryNameByOwner(owner);
        const name = res?.primary ? String(res.primary).toLowerCase() : null;
        if (!cancelled) setPrimaryName(name);
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
  }, [enabled, owner, opts?.chainId]);

  return { primaryName, isLoading };
}
