/**
 * NFT Metadata Fetching Service for Hub
 * Handles fetching and parsing NFT metadata from IPFS
 */

import { fetchJSON } from '~/lib/ipfs/gateway';
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
  // Standard format: baseUri/{tokenId}.json
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

    const parsedMetadata: ParsedNFTMetadata = {
      tokenId,
      name: metadata.name || `${collection.name} #${tokenId}`,
      description: metadata.description,
      image: metadata.image,
      traits,
      rawMetadata: metadata,
    };

    return parsedMetadata;
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

  // Fetch metadata in parallel batches
  const batchSize = 20;
  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize);
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
      } else if (result.status === 'rejected') {
        console.warn(`Failed to fetch metadata for ${collectionId} #${batch[index]}:`, result.reason);
      }
    });
  }

  return results;
}
