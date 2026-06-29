import type { AdEntry } from '@/lib/ads/types';

export const ADS_START_SLACK_MS = 5 * 60 * 1000;

export function isAdEntryActive(ad: AdEntry, now = Date.now()): boolean {
  const start = new Date(ad.startTime).getTime();
  const end = new Date(ad.endTime).getTime();
  return start - ADS_START_SLACK_MS <= now && end > now;
}

export function filterActiveAdEntries(ads: AdEntry[], now = Date.now()): AdEntry[] {
  return ads.filter((ad) => isAdEntryActive(ad, now));
}

/** Server + client: chain results win; keep other still-active local entries. */
export function mergeActiveAdEntries(primary: AdEntry[], secondary: AdEntry[], now = Date.now()): AdEntry[] {
  const byId = new Map<string, AdEntry>();
  for (const ad of filterActiveAdEntries(primary, now)) {
    byId.set(ad.id, ad);
  }
  for (const ad of filterActiveAdEntries(secondary, now)) {
    if (!byId.has(ad.id)) byId.set(ad.id, ad);
  }
  return [...byId.values()];
}
