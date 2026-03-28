import { unstable_cache } from 'next/cache';
import { buildActiveAdsFromChain } from '@/lib/ads/chainRegistry';
import { getAllActiveAds } from '@/lib/ads/mockAds';
import type { AdEntry } from '@/lib/ads/types';

async function fetchArchiveAds(): Promise<AdEntry[]> {
  const cid = process.env.NEXT_PUBLIC_ADS_ARCHIVE_CID?.trim();
  if (!cid) return [];
  const clean = cid.replace(/^ipfs:\/\//, '');
  const urls = [
    `https://cloudflare-ipfs.com/ipfs/${clean}`,
    `https://ipfs.io/ipfs/${clean}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) return data as AdEntry[];
      if (data && typeof data === 'object' && Array.isArray((data as { ads?: unknown }).ads)) {
        return (data as { ads: AdEntry[] }).ads;
      }
    } catch {
      // next
    }
  }
  return [];
}

async function buildMergedActiveAds(): Promise<AdEntry[]> {
  if (process.env.NEXT_PUBLIC_ADS_USE_MOCK === '1') {
    return getAllActiveAds();
  }
  const [chain, archive] = await Promise.all([buildActiveAdsFromChain(), fetchArchiveAds()]);
  const byId = new Map<string, AdEntry>();
  for (const a of archive) {
    byId.set(a.id, a);
  }
  for (const a of chain) {
    byId.set(a.id, a);
  }
  const now = Date.now();
  return [...byId.values()].filter(
    (ad) => new Date(ad.startTime).getTime() <= now && new Date(ad.endTime).getTime() > now
  );
}

export const getCachedActiveAds = unstable_cache(
  async () => buildMergedActiveAds(),
  ['kasparex-ads-active-v1'],
  { revalidate: 120 }
);
