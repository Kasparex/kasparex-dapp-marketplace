/**
 * Collection Metadata Loader
 * Loads full collection metadata for accurate rarity calculations
 * Uses IndexedDB cache for persistent storage and faster loading
 */

import { fetchCollectionByTicker } from './kaspa-com-api';
import { fetchMultipleNFTMetadata } from './metadata';
import type { ParsedNFTMetadata } from './metadata';
import {
  getCachedCollectionMetadata,
  setCachedCollectionMetadata,
  getCachedNFTMetadata,
  setCachedNFTMetadata,
} from './cache';

/**
 * Load all metadata for a collection
 * Uses cache when available, fetches missing data in parallel batches
 */
export async function loadFullCollectionMetadata(
  collectionId: string,
  useCache = true
): Promise<ParsedNFTMetadata[]> {
  try {
    // Check cache first
    if (useCache) {
      const cached = await getCachedCollectionMetadata<ParsedNFTMetadata[]>(collectionId);
      if (cached && cached.length > 0) {
        console.log(`Using cached metadata for ${collectionId} (${cached.length} NFTs)`);
        // Return cached data immediately.
        // NOTE: We intentionally do not trigger a background full refresh here.
        // A "full collection refresh" can be very expensive (many IPFS/registry fetches) and can
        // accidentally create large usage spikes just by visiting pages that touch this cache.
        return cached;
      }
    }

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

    // Check cache for individual NFTs first
    const cachedMetadata: ParsedNFTMetadata[] = [];
    const missingTokenIds: number[] = [];

    if (useCache) {
      await Promise.all(
        tokenIds.map(async (tokenId) => {
          const cached = await getCachedNFTMetadata<ParsedNFTMetadata>(collectionId, tokenId);
          if (cached) {
            cachedMetadata.push(cached);
          } else {
            missingTokenIds.push(tokenId);
          }
        })
      );
    } else {
      missingTokenIds.push(...tokenIds);
    }

    // If we have all metadata from cache, return it
    if (missingTokenIds.length === 0 && cachedMetadata.length === tokenIds.length) {
      // Sort by tokenId to ensure correct order
      cachedMetadata.sort((a, b) => a.tokenId - b.tokenId);
      return cachedMetadata;
    }

    console.log(
      `Loading ${missingTokenIds.length} missing NFTs for ${collectionId} (${cachedMetadata.length} from cache)`
    );

    // Fetch missing metadata in parallel batches
    const batchSize = 150; // Increased from 50
    const concurrentBatches = 3; // Process 3 batches in parallel
    const allMetadata: ParsedNFTMetadata[] = [...cachedMetadata];

    // Process batches in parallel groups
    for (let i = 0; i < missingTokenIds.length; i += batchSize * concurrentBatches) {
      const batchGroup = [];
      
      // Create multiple batches to process in parallel
      for (let j = 0; j < concurrentBatches && i + j * batchSize < missingTokenIds.length; j++) {
        const batchStart = i + j * batchSize;
        const batch = missingTokenIds.slice(batchStart, batchStart + batchSize);
        if (batch.length > 0) {
          batchGroup.push(
            fetchMultipleNFTMetadata(collectionId, batch).then((metadataMap) => {
              const batchMetadata = Array.from(metadataMap.values());
              // Cache individual NFTs
              batchMetadata.forEach((metadata) => {
                setCachedNFTMetadata(collectionId, metadata.tokenId, metadata).catch(console.error);
              });
              return batchMetadata;
            })
          );
        }
      }

      // Wait for all batches in this group to complete
      const batchResults = await Promise.allSettled(batchGroup);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          allMetadata.push(...result.value);
        } else {
          console.error('Batch fetch failed:', result.reason);
        }
      });

      // Small delay between batch groups to avoid overwhelming gateways
      if (i + batchSize * concurrentBatches < missingTokenIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Sort by tokenId to ensure correct order
    allMetadata.sort((a, b) => a.tokenId - b.tokenId);

    // Cache the full collection
    if (useCache && allMetadata.length > 0) {
      setCachedCollectionMetadata(collectionId, allMetadata).catch(console.error);
    }

    return allMetadata;
  } catch (error) {
    console.error(`Error loading full collection metadata for ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Get cached collection metadata or load if not cached
 * Uses IndexedDB for persistent caching
 */
export async function getCollectionMetadata(
  collectionId: string,
  useCache = true
): Promise<ParsedNFTMetadata[]> {
  return loadFullCollectionMetadata(collectionId, useCache);
}

/**
 * Clear collection metadata cache
 */
export async function clearCollectionMetadataCache(collectionId?: string): Promise<void> {
  if (collectionId) {
    const { clearCollectionCache } = await import('./cache');
    await clearCollectionCache(collectionId);
  } else {
    const { clearAllCaches } = await import('./cache');
    await clearAllCaches();
  }
}

