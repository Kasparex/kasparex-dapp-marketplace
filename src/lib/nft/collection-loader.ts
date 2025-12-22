/**
 * Collection Metadata Loader
 * Loads full collection metadata for accurate rarity calculations
 */

import { fetchCollectionByTicker } from './kaspa-com-api';
import { fetchMultipleNFTMetadata } from './metadata';
import type { ParsedNFTMetadata } from './metadata';

/**
 * Load all metadata for a collection
 */
export async function loadFullCollectionMetadata(
  collectionId: string
): Promise<ParsedNFTMetadata[]> {
  try {
    // Get collection data to know total supply
    const collectionData = await fetchCollectionByTicker(collectionId);
    if (!collectionData) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const totalSupply = collectionData.totalSupply || collectionData.totalMinted || 0;
    if (totalSupply === 0) {
      console.warn(`Collection ${collectionId} has no supply data`);
      return [];
    }

    // Generate token IDs (assuming they start from 1)
    const tokenIds = Array.from({ length: totalSupply }, (_, i) => i + 1);

    // Fetch metadata in batches to avoid overwhelming the gateway
    const batchSize = 50;
    const allMetadata: ParsedNFTMetadata[] = [];

    for (let i = 0; i < tokenIds.length; i += batchSize) {
      const batch = tokenIds.slice(i, i + batchSize);
      const metadataMap = await fetchMultipleNFTMetadata(collectionId, batch);
      const batchMetadata = Array.from(metadataMap.values());
      allMetadata.push(...batchMetadata);

      // Small delay to avoid rate limiting
      if (i + batchSize < tokenIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return allMetadata;
  } catch (error) {
    console.error(`Error loading full collection metadata for ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Cache for full collection metadata
 */
const collectionMetadataCache = new Map<string, {
  metadata: ParsedNFTMetadata[];
  timestamp: number;
}>();

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Get cached collection metadata or load if not cached
 */
export async function getCollectionMetadata(
  collectionId: string,
  useCache = true
): Promise<ParsedNFTMetadata[]> {
  const cacheKey = collectionId.toUpperCase();
  const cached = collectionMetadataCache.get(cacheKey);

  // Check if cache is valid
  if (useCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.metadata;
  }

  // Load fresh data
  const metadata = await loadFullCollectionMetadata(collectionId);
  
  // Update cache
  collectionMetadataCache.set(cacheKey, {
    metadata,
    timestamp: Date.now(),
  });

  return metadata;
}

/**
 * Clear collection metadata cache
 */
export function clearCollectionMetadataCache(collectionId?: string): void {
  if (collectionId) {
    collectionMetadataCache.delete(collectionId.toUpperCase());
  } else {
    collectionMetadataCache.clear();
  }
}

