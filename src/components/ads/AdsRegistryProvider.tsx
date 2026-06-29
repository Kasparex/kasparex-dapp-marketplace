'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAdsRegistry } from '@/hooks/useAdsRegistry';
import type { AdEntry } from '@/lib/ads/types';

type AdsRegistryCtx = {
  ads: AdEntry[];
  loading: boolean;
  error: string | null;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  upsertAd: (entry: AdEntry) => void;
};

const AdsRegistryContext = createContext<AdsRegistryCtx | null>(null);

export function AdsRegistryProvider({ children }: { children: ReactNode }) {
  const value = useAdsRegistry();
  return <AdsRegistryContext.Provider value={value}>{children}</AdsRegistryContext.Provider>;
}

export function useAdsRegistryContext(): AdsRegistryCtx {
  const ctx = useContext(AdsRegistryContext);
  if (!ctx) {
    throw new Error('useAdsRegistryContext must be used within AdsRegistryProvider');
  }
  return ctx;
}
