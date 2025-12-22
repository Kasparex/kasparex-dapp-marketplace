/**
 * NFT Metadata Fetching Service
 * Handles fetching and parsing NFT metadata from IPFS
 */

import { fetchJSON } from '@/lib/ipfs/gateway';
import { getCollectionById } from './collections';

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
 */
export async function fetchNFTMetadata(
  collectionId: string,
  tokenId: number
): Promise<ParsedNFTMetadata | null> {
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

    return {
      tokenId,
      name: metadata.name || `${collection.name} #${tokenId}`,
      description: metadata.description,
      image: metadata.image,
      traits,
      rawMetadata: metadata,
    };
  } catch (error) {
    console.error(`Error fetching NFT metadata for ${collectionId} #${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch metadata for multiple NFTs
 */
export async function fetchMultipleNFTMetadata(
  collectionId: string,
  tokenIds: number[]
): Promise<Map<number, ParsedNFTMetadata>> {
  const results = new Map<number, ParsedNFTMetadata>();

  // Fetch in parallel with batching to avoid overwhelming the gateway
  const batchSize = 10;
  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize);
    const promises = batch.map((tokenId) =>
      fetchNFTMetadata(collectionId, tokenId).then((metadata) => ({
        tokenId,
        metadata,
      }))
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ tokenId, metadata }) => {
      if (metadata) {
        results.set(tokenId, metadata);
      }
    });
  }

  return results;
}

/**
 * Cache for metadata (in-memory, could be enhanced with localStorage)
 */
const metadataCache = new Map<string, ParsedNFTMetadata>();

/**
 * Get cached metadata or fetch if not cached
 */
export async function getNFTMetadata(
  collectionId: string,
  tokenId: number,
  useCache = true
): Promise<ParsedNFTMetadata | null> {
  const cacheKey = `${collectionId}-${tokenId}`;

  if (useCache && metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  const metadata = await fetchNFTMetadata(collectionId, tokenId);
  if (metadata && useCache) {
    metadataCache.set(cacheKey, metadata);
  }

  return metadata;
}

/**
 * Clear metadata cache
 */
export function clearMetadataCache(collectionId?: string): void {
  if (collectionId) {
    const keysToDelete: string[] = [];
    metadataCache.forEach((_, key) => {
      if (key.startsWith(`${collectionId}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => metadataCache.delete(key));
  } else {
    metadataCache.clear();
  }
}

