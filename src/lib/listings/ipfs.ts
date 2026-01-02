/**
 * IPFS-specific helpers for listings
 */

import { ListingMetadata } from './types';
import { fetchJSON } from '@/lib/ipfs/gateway';
import { resolveAsset } from '@/lib/storage/decentralized';

/**
 * Fetch listing metadata from IPFS
 */
export async function fetchListingMetadata(cid: string): Promise<ListingMetadata> {
  try {
    const metadata = await fetchJSON<ListingMetadata>(cid);
    if (!metadata) {
      throw new Error('Metadata not found');
    }
    return metadata;
  } catch (error) {
    throw new Error(`Failed to fetch listing metadata from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolve listing image URLs
 */
export async function resolveListingImage(cid: string): Promise<string> {
  return resolveAsset(cid);
}

/**
 * Batch resolve multiple listing images
 */
export async function resolveListingImages(
  cids: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  await Promise.all(
    cids.map(async (cid) => {
      try {
        const url = await resolveAsset(cid);
        results[cid] = url;
      } catch (error) {
        console.error(`Failed to resolve image ${cid}:`, error);
        // Leave empty - UI will handle fallback
      }
    })
  );

  return results;
}

