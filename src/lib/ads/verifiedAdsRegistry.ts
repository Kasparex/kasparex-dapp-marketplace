import type { AdEntry } from '@/lib/ads/types';
import { filterActiveAdEntries } from '@/lib/ads/adActiveWindow';

/** Warm-instance cache of ads confirmed via /api/ads/verify (survives slow chain scans). */
const verifiedById = new Map<string, AdEntry>();

export function registerVerifiedAd(entry: AdEntry): void {
  verifiedById.set(entry.id, entry);
}

export function getVerifiedActiveAds(): AdEntry[] {
  return filterActiveAdEntries([...verifiedById.values()]);
}
