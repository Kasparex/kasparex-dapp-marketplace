/**
 * IPFS Metadata Loading Utilities for Tokens
 * Handles loading and caching token metadata from IPFS
 */

import { getIPFSClient } from '@/lib/ipfs/client';
import { getBestGatewayUrl, fetchJSON } from '@/lib/ipfs/gateway';
import type { Token, TokenIPFSMetadata } from './types';

// Cache for loaded metadata
const metadataCache = new Map<string, TokenIPFSMetadata | null>();

/**
 * Load token metadata from IPFS
 */
export async function loadTokenMetadataFromIPFS(
  cid: string | null | undefined
): Promise<TokenIPFSMetadata | null> {
  if (!cid) return null;

  // Check cache first
  if (metadataCache.has(cid)) {
    return metadataCache.get(cid) || null;
  }

  try {
    // Clean CID (remove ipfs:// prefix if present)
    const cleanCid = cid.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');

    // Try using IPFS client first
    const client = getIPFSClient();
    let metadata = await client.getJSON<TokenIPFSMetadata>(cleanCid);

    // Fallback to gateway fetch
    if (!metadata) {
      metadata = await fetchJSON<TokenIPFSMetadata>(cleanCid);
    }

    // Cache the result (even if null to avoid repeated fetches)
    metadataCache.set(cid, metadata || null);

    return metadata || null;
  } catch (error) {
    console.error('Failed to load token metadata from IPFS:', error);
    // Cache null to avoid repeated failed fetches
    metadataCache.set(cid, null);
    return null;
  }
}

/**
 * Get image URL from IPFS CID
 */
export function getTokenImageUrl(cid: string | null | undefined): string | null {
  if (!cid) return null;
  const cleanCid = cid.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  return getBestGatewayUrl(cleanCid);
}

/**
 * Merge IPFS metadata with base token data
 */
export function mergeTokenMetadata(
  baseToken: Token,
  ipfsMetadata: TokenIPFSMetadata | null
): Token {
  if (!ipfsMetadata) return baseToken;

  return {
    ...baseToken,
    // Override with IPFS data if available
    description: ipfsMetadata.description || baseToken.description,
    logoCid: ipfsMetadata.logoCid || baseToken.logoCid,
    featuredImageCid: ipfsMetadata.featuredImageCid || baseToken.featuredImageCid,
    allocations: ipfsMetadata.allocations || baseToken.allocations,
    roadmap: ipfsMetadata.roadmap || baseToken.roadmap,
    relatedDAppIds: ipfsMetadata.relatedDAppIds || baseToken.relatedDAppIds,
    links: ipfsMetadata.links || baseToken.links,
    tags: ipfsMetadata.tags || baseToken.tags,
  };
}

/**
 * Load and merge token metadata from IPFS
 */
export async function loadTokenWithMetadata(token: Token): Promise<Token> {
  if (!token.metadataCid) return token;

  const ipfsMetadata = await loadTokenMetadataFromIPFS(token.metadataCid);
  return mergeTokenMetadata(token, ipfsMetadata);
}

/**
 * Clear metadata cache (useful for testing or forced refresh)
 */
export function clearTokenMetadataCache(): void {
  metadataCache.clear();
}
