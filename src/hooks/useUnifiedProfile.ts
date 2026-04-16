'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '@/lib/ipfs/gateway';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import type { UnifiedProfileMetadata } from '@/lib/profile/types';
import { fetchProfileRegistryIndex, getProfileRecordForKaspaAddress } from '@/lib/profile/ipfs-registry';

const LOCAL_FALLBACK_PREFIX = 'profile_'; // legacy `useProfile` key prefix

export type UseUnifiedProfileResult = {
  profile: UnifiedProfileMetadata | null;
  isLoading: boolean;
  source: 'ipfs' | 'localStorage' | 'none';
  /** Only updates local state + localStorage. Publishing CID requires IPFS credentials & registry update. */
  updateLocalProfile: (updates: Partial<UnifiedProfileMetadata>) => void;
};

function safeParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function useUnifiedProfile(kaspaAddress: string | null | undefined): UseUnifiedProfileResult {
  const normalizedKaspa = useMemo(() => {
    if (!kaspaAddress) return null;
    try {
      return normalizeKaspaAddress(kaspaAddress).toLowerCase();
    } catch {
      return kaspaAddress.trim().toLowerCase();
    }
  }, [kaspaAddress]);

  const [profile, setProfile] = useState<UnifiedProfileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'ipfs' | 'localStorage' | 'none'>('none');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setProfile(null);
      setSource('none');

      if (!normalizedKaspa) {
        setIsLoading(false);
        return;
      }

      // 1) IPFS registry → profile CID → metadata JSON
      try {
        const idx = await fetchProfileRegistryIndex();
        const rec = getProfileRecordForKaspaAddress(idx, normalizedKaspa);
        if (rec?.profileCid) {
          const meta = await fetchJSON<UnifiedProfileMetadata>(rec.profileCid);
          if (!cancelled && meta && meta.kaspaAddress) {
            setProfile(meta);
            setSource('ipfs');
            setIsLoading(false);
            return;
          }
        }
      } catch (_) {
        // fall through
      }

      // 2) Legacy localStorage fallback (existing `useProfile` format)
      if (typeof window !== 'undefined') {
        const legacyKey = `${LOCAL_FALLBACK_PREFIX}${normalizedKaspa}`;
        const legacyRaw = localStorage.getItem(legacyKey);
        const legacy = legacyRaw ? safeParseJson<Record<string, unknown>>(legacyRaw) : null;
        if (legacy && !cancelled) {
          const migrated: UnifiedProfileMetadata = {
            version: 1,
            updatedAt: Date.now(),
            kaspaAddress: normalizedKaspa,
            displayName: String((legacy as any).displayName || ''),
            bio: String((legacy as any).bio || ''),
            avatarUrl: (legacy as any).profilePicture ? String((legacy as any).profilePicture) : undefined,
            bannerUrl: (legacy as any).featuredImage ? String((legacy as any).featuredImage) : undefined,
          };
          setProfile(migrated);
          setSource('localStorage');
          setIsLoading(false);
          return;
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedKaspa]);

  const updateLocalProfile = useCallback(
    (updates: Partial<UnifiedProfileMetadata>) => {
      if (!normalizedKaspa) return;
      const next: UnifiedProfileMetadata = {
        version: 1,
        updatedAt: Date.now(),
        kaspaAddress: normalizedKaspa,
        ...(profile || {}),
        ...updates,
      };
      setProfile(next);
      setSource('localStorage');

      // Keep compatibility with existing Profile UI until registry publishing is wired.
      try {
        localStorage.setItem(`${LOCAL_FALLBACK_PREFIX}${normalizedKaspa}`, JSON.stringify({
          displayName: next.displayName || '',
          bio: next.bio || '',
          hideBalance: false,
          preventScreenshots: false,
          profilePicture: next.avatarUrl,
          featuredImage: next.bannerUrl,
        }));
      } catch (_) {}
    },
    [normalizedKaspa, profile]
  );

  return { profile, isLoading, source, updateLocalProfile };
}

