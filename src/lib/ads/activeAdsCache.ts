import { unstable_cache } from 'next/cache';
import { buildActiveAdsFromChain } from '@/lib/ads/chainRegistry';
import { getAllActiveAds } from '@/lib/ads/mockAds';
import { filterActiveAdEntries, mergeActiveAdEntries } from '@/lib/ads/adActiveWindow';
import { getVerifiedActiveAds } from '@/lib/ads/verifiedAdsRegistry';
import type { AdEntry } from '@/lib/ads/types';

let lastGoodAds: AdEntry[] = [];
let lastGoodAt = 0;

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
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

  const [chain, archive, verified] = await Promise.all([
    buildActiveAdsFromChain(),
    fetchArchiveAds(),
    Promise.resolve(getVerifiedActiveAds()),
  ]);

  const byId = new Map<string, AdEntry>();
  for (const a of archive) {
    if (filterActiveAdEntries([a]).length) byId.set(a.id, a);
  }
  for (const a of verified) {
    byId.set(a.id, a);
  }
  for (const a of chain) {
    byId.set(a.id, a);
  }

  return filterActiveAdEntries([...byId.values()]);
}

async function buildMergedActiveAdsSafe(): Promise<AdEntry[]> {
  try {
    const ads = await buildMergedActiveAds();
    lastGoodAds = ads;
    lastGoodAt = Date.now();
    return ads;
  } catch (e) {
    console.error('[ads/active] build failed, using last good snapshot if available', e);
    if (lastGoodAds.length > 0 && Date.now() - lastGoodAt < 30 * 60 * 1000) {
      return lastGoodAds;
    }
    const verified = getVerifiedActiveAds();
    if (verified.length > 0) return verified;
    throw e;
  }
}

export const getCachedActiveAds = unstable_cache(
  async () => buildMergedActiveAdsSafe(),
  ['kasparex-ads-active-v3'],
  { revalidate: 45, tags: ['ads-active'] }
);

/** Merge layers for API routes that already have fresh chain data. */
export function mergeAdLayers(chain: AdEntry[], extra: AdEntry[] = []): AdEntry[] {
  return mergeActiveAdEntries(chain, [...extra, ...getVerifiedActiveAds()]);
}
