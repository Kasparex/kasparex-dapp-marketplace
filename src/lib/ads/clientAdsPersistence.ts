import type { AdEntry } from '@/lib/ads/types';
import { filterActiveAdEntries } from '@/lib/ads/adActiveWindow';

const STORAGE_KEY = 'kasparex-active-ads-v1';

export function readPersistedActiveAds(): AdEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return filterActiveAdEntries(parsed as AdEntry[]);
  } catch {
    return [];
  }
}

export function writePersistedActiveAds(ads: AdEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filterActiveAdEntries(ads)));
  } catch {
    // ignore quota / private mode
  }
}
