'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChroniclesContentId, EntitlementOffer } from './types';
import catalogFile from '../../../../data/chronicles/entitlements-catalog.json';
import mockFile from '../../../../data/chronicles/entitlements-mock.json';
import { getLocalVaultUnlockedIds } from '@/lib/chronicles/vault/localUnlocks';

function normalizeKaspaAddress(address: string | null | undefined): string | null {
  if (!address || typeof address !== 'string') return null;
  const t = address.trim();
  if (!t) return null;
  return t.startsWith('kaspa:') ? t : `kaspa:${t}`;
}

export function useChroniclesEntitlements(connectedAddress: string | null | undefined) {
  const [localBump, setLocalBump] = useState(0);

  useEffect(() => {
    const onUnlock = () => setLocalBump((b) => b + 1);
    window.addEventListener('chronicles-vault-unlock', onUnlock);
    return () => window.removeEventListener('chronicles-vault-unlock', onUnlock);
  }, []);

  const catalog = useMemo(() => {
    const raw = catalogFile as { offers?: EntitlementOffer[] };
    return raw.offers ?? [];
  }, []);

  const unlockedIds = useMemo(() => {
    const addr = normalizeKaspaAddress(connectedAddress);
    if (!addr) return new Set<ChroniclesContentId>();
    const mock = mockFile as { byAddress?: Record<string, { unlockedIds?: string[] }> };
    const row = mock.byAddress?.[addr];
    const fromMock = new Set((row?.unlockedIds ?? []) as ChroniclesContentId[]);
    for (const id of getLocalVaultUnlockedIds(addr)) {
      fromMock.add(id);
    }
    return fromMock;
  }, [connectedAddress, localBump]);

  const isUnlocked = useCallback(
    (id: ChroniclesContentId) => {
      if (!connectedAddress) return false;
      return unlockedIds.has(id);
    },
    [connectedAddress, unlockedIds]
  );

  return {
    catalog,
    unlockedIds: Array.from(unlockedIds),
    isUnlocked,
  };
}
