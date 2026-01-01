/**
 * NFT Metadata Fetching Service
 * Handles fetching and parsing NFT metadata from IPFS
 * Uses IndexedDB cache for faster subsequent loads
 */

import { fetchJSON } from '@/lib/ipfs/gateway';
import { getCollectionById } from './collections';
import {
  getCachedNFTMetadata,
  setCachedNFTMetadata,
} from './cache';

export interface NFTTrait {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: NFTTrait[];
  traits?: NFTTrait[];
  [key: string]: unknown;
}

export interface ParsedNFTMetadata {
  tokenId: number;
  name: string;
  description?: string;
  image?: string;
  traits: NFTTrait[];
  rawMetadata: NFTMetadata;
}

/**
 * Extract CID from IPFS URI
 */
function extractCidFromUri(uri: string): string {
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '');
  }
  // Handle https://ipfs.io/ipfs/ format
  if (uri.includes('/ipfs/')) {
    const parts = uri.split('/ipfs/');
    return parts[1]?.split('/')[0] || '';
  }
  // Assume it's already a CID
  return uri;
}

/**
 * Get NFT metadata URI for a specific token ID
 */
function getTokenMetadataUri(baseUri: string, tokenId: number): string {
  const cid = extractCidFromUri(baseUri);
  // Standard format: baseUri/{tokenId} or baseUri/{tokenId}.json
  // Most collections use {tokenId}.json format
  return `${cid}/${tokenId}.json`;
}

/**
 * Fetch metadata for a specific NFT
 * Checks cache first before fetching from IPFS
 */
export async function fetchNFTMetadata(
  collectionId: string,
  tokenId: number,
  useCache = true
): Promise<ParsedNFTMetadata | null> {
  // Check cache first
  if (useCache) {
    const cached = await getCachedNFTMetadata<ParsedNFTMetadata>(collectionId, tokenId);
    if (cached) {
      return cached;
    }
  }

  const collection = getCollectionById(collectionId);
  if (!collection) {
    console.error(`Collection ${collectionId} not found`);
    return null;
  }

  try {
    const metadataPath = getTokenMetadataUri(collection.baseUri, tokenId);
    const metadata = await fetchJSON<NFTMetadata>(metadataPath);

    if (!metadata) {
      console.warn(`Failed to fetch metadata for ${collectionId} #${tokenId}`);
      return null;
    }

    // Parse traits from attributes or traits field
    const traits: NFTTrait[] = metadata.attributes || metadata.traits || [];

    const parsedMetadata: ParsedNFTMetadata = {
      tokenId,
      name: metadata.name || `${collection.name} #${tokenId}`,
      description: metadata.description,
      image: metadata.image,
      traits,
      rawMetadata: metadata,
    };

    // Cache the fetched metadata
    if (useCache) {
      setCachedNFTMetadata(collectionId, tokenId, parsedMetadata).catch(console.error);
    }

    return parsedMetadata;
  } catch (error) {
    console.error(`Error fetching NFT metadata for ${collectionId} #${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch metadata for multiple NFTs
 * Checks cache first, only fetches missing NFTs
 */
export async function fetchMultipleNFTMetadata(
  collectionId: string,
  tokenIds: number[],
  useCache = true
): Promise<Map<number, ParsedNFTMetadata>> {
  const results = new Map<number, ParsedNFTMetadata>();
  const missingTokenIds: number[] = [];

  // Check cache first
  if (useCache) {
    await Promise.all(
      tokenIds.map(async (tokenId) => {
        const cached = await getCachedNFTMetadata<ParsedNFTMetadata>(collectionId, tokenId);
        if (cached) {
          results.set(tokenId, cached);
        } else {
          missingTokenIds.push(tokenId);
        }
      })
    );
  } else {
    missingTokenIds.push(...tokenIds);
  }

  // If all were cached, return immediately
  if (missingTokenIds.length === 0) {
    return results;
  }

  // Fetch missing metadata in parallel batches
  const batchSize = 20; // Increased from 10
  for (let i = 0; i < missingTokenIds.length; i += batchSize) {
    const batch = missingTokenIds.slice(i, i + batchSize);
    const promises = batch.map((tokenId) =>
      fetchNFTMetadata(collectionId, tokenId).then((metadata) => ({
        tokenId,
        metadata,
      }))
    );

    const batchResults = await Promise.allSettled(promises);
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.metadata) {
        const { tokenId, metadata } = result.value;
        results.set(tokenId, metadata);
        // Cache the fetched metadata
        if (useCache) {
          setCachedNFTMetadata(collectionId, tokenId, metadata).catch(console.error);
        }
      } else if (result.status === 'rejected') {
        console.warn(`Failed to fetch metadata for ${collectionId} #${batch[index]}:`, result.reason);
      }
    });
  }

  return results;
}

/**
 * Get cached metadata or fetch if not cached
 * Uses IndexedDB for persistent caching
 */
export async function getNFTMetadata(
  collectionId: string,
  tokenId: number,
  useCache = true
): Promise<ParsedNFTMetadata | null> {
  return fetchNFTMetadata(collectionId, tokenId, useCache);
}

/**
 * Clear metadata cache
 */
export async function clearMetadataCache(collectionId?: string): Promise<void> {
  if (collectionId) {
    const { clearCollectionCache } = await import('./cache');
    await clearCollectionCache(collectionId);
  } else {
    const { clearAllCaches } = await import('./cache');
    await clearAllCaches();
  }
}

