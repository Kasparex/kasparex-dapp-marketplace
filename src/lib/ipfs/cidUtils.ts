import { extractCidFromIpfsUrl } from '@/lib/ipfs/gateway';

/** Normalize a Pinata/IPFS hash for unpin API calls. */
export function cleanIpfsHash(input: string): string {
  return input.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '').trim();
}

/** Extract unique CIDs from URLs, ipfs:// URIs, or raw hashes. */
export function extractCidsFromValues(...values: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const value of values) {
    const raw = value?.trim();
    if (!raw) continue;
    const fromUrl = extractCidFromIpfsUrl(raw);
    if (fromUrl) {
      out.add(cleanIpfsHash(fromUrl));
      continue;
    }
    if (raw.startsWith('Qm') || raw.startsWith('baf')) {
      out.add(cleanIpfsHash(raw));
    }
  }
  return [...out];
}

export function collectVblogMediaCids(article: { featuredImage?: string | null }): string[] {
  return extractCidsFromValues(article.featuredImage);
}

export function collectTokenMediaCids(listing: {
  logoCid?: string | null;
  logoUrl?: string | null;
  featuredImageCid?: string | null;
  featuredImageUrl?: string | null;
}): string[] {
  return extractCidsFromValues(
    listing.logoCid,
    listing.logoUrl,
    listing.featuredImageCid,
    listing.featuredImageUrl,
  );
}

export function collectDappMediaCids(listing: {
  logoCid?: string | null;
  logoUrl?: string | null;
  featureImageCid?: string | null;
  featureImageUrl?: string | null;
  galleryCids?: string[];
  galleryUrls?: string[];
}): string[] {
  return extractCidsFromValues(
    listing.logoCid,
    listing.logoUrl,
    listing.featureImageCid,
    listing.featureImageUrl,
    ...(listing.galleryCids ?? []),
    ...(listing.galleryUrls ?? []),
  );
}

export function collectChroniclesMediaCids(submission: { featuredImageUrl?: string | null }): string[] {
  return extractCidsFromValues(submission.featuredImageUrl);
}

export function collectGamesPromoMediaCids(listing: {
  featuredImageCid?: string | null;
  featuredImageUrl?: string | null;
}): string[] {
  return extractCidsFromValues(listing.featuredImageCid, listing.featuredImageUrl);
}

export function collectStoreMediaCids(product: {
  thumbnailCid?: string | null;
  assetCids?: string[];
}): string[] {
  return extractCidsFromValues(product.thumbnailCid, ...(product.assetCids ?? []));
}

export function collectMagazineMediaCids(issue: {
  coverImage?: string | null;
  previewImages?: string[];
  cid?: string | null;
}): string[] {
  return extractCidsFromValues(issue.coverImage, issue.cid, ...(issue.previewImages ?? []));
}

/** Best-effort server-side Pinata unpin (non-blocking). */
export async function requestIpfsUnpin(cids: string[]): Promise<void> {
  const unique = [...new Set(cids.map(cleanIpfsHash).filter(Boolean))];
  if (!unique.length || typeof window === 'undefined') return;
  try {
    await fetch('/api/ipfs/unpin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cids: unique }),
    });
  } catch (e) {
    console.warn('[ipfs/unpin] request failed', e);
  }
}
