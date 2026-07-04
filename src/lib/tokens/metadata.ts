/**
 * IPFS Metadata Loading Utilities for Tokens
 * Handles loading and caching token metadata from IPFS
 */

import { getIPFSClient } from '@/lib/ipfs/client';
import { getBestGatewayUrl, fetchJSON } from '@/lib/ipfs/gateway';
import type { Token, TokenIPFSMetadata } from './types';
import { loadTokenLogo, loadTokenFeaturedImage } from './ipfs';
import { getBaseTokenLogoUrl, getBaseTokenFeaturedImageUrl } from './baseLogos';

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
    whitepaperUrl: ipfsMetadata.whitepaperUrl || baseToken.whitepaperUrl,
  };
}

/**
 * Load token logo with priority chain
 * Priority: token.logoCid > token.logo > localStorage override > baseLogos fallback
 */
export function loadTokenLogoUrl(token: Token): string | null {
  if (token.logoCid) {
    return getTokenImageUrl(token.logoCid);
  }

  if (token.logo?.trim()) {
    return token.logo.trim();
  }

  const localStorageLogo = loadTokenLogo(token.id);
  if (localStorageLogo) {
    if (!localStorageLogo.startsWith('http://') && !localStorageLogo.startsWith('https://')) {
      return getTokenImageUrl(localStorageLogo);
    }
    return localStorageLogo;
  }

  const baseLogo = getBaseTokenLogoUrl(token.id);
  if (baseLogo) {
    if (!baseLogo.startsWith('http://') && !baseLogo.startsWith('https://')) {
      return getTokenImageUrl(baseLogo);
    }
    return baseLogo;
  }

  return null;
}

/**
 * Load token featured image with priority chain
 * Priority: token.featuredImageCid > token.featuredImage > localStorage override > baseLogos fallback
 */
export function loadTokenFeaturedImageUrl(token: Token): string | null {
  if (token.featuredImageCid) {
    return getTokenImageUrl(token.featuredImageCid);
  }

  if (token.featuredImage?.trim()) {
    return token.featuredImage.trim();
  }

  const localStorageFeatured = loadTokenFeaturedImage(token.id);
  if (localStorageFeatured) {
    if (!localStorageFeatured.startsWith('http://') && !localStorageFeatured.startsWith('https://')) {
      return getTokenImageUrl(localStorageFeatured);
    }
    return localStorageFeatured;
  }

  const baseFeatured = getBaseTokenFeaturedImageUrl(token.id);
  if (baseFeatured) {
    if (!baseFeatured.startsWith('http://') && !baseFeatured.startsWith('https://')) {
      return getTokenImageUrl(baseFeatured);
    }
    return baseFeatured;
  }

  return null;
}

/**
 * Load and merge token metadata from IPFS
 * Also loads logos from localStorage and base config
 */
export async function loadTokenWithMetadata(token: Token): Promise<Token> {
  let mergedToken = token;

  // Load IPFS metadata if available
  if (token.metadataCid) {
    const ipfsMetadata = await loadTokenMetadataFromIPFS(token.metadataCid);
    mergedToken = mergeTokenMetadata(mergedToken, ipfsMetadata);
  }

  // Load logos from localStorage/base config (override IPFS metadata)
  const logoUrl = loadTokenLogoUrl(mergedToken);
  const featuredImageUrl = loadTokenFeaturedImageUrl(mergedToken);

  // Update token with loaded images
  if (logoUrl) {
    // If it's an IPFS URL, extract CID; otherwise use as URL
    const cidMatch = logoUrl.match(/\/ipfs\/([^/?#]+)/);
    if (cidMatch) {
      mergedToken = { ...mergedToken, logoCid: cidMatch[1] };
    } else if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
      mergedToken = { ...mergedToken, logoCid: logoUrl };
    } else {
      mergedToken = { ...mergedToken, logo: logoUrl };
    }
  }

  if (featuredImageUrl) {
    const cidMatch = featuredImageUrl.match(/\/ipfs\/([^/?#]+)/);
    if (cidMatch) {
      mergedToken = { ...mergedToken, featuredImageCid: cidMatch[1] };
    } else if (!featuredImageUrl.startsWith('http://') && !featuredImageUrl.startsWith('https://')) {
      mergedToken = { ...mergedToken, featuredImageCid: featuredImageUrl };
    } else {
      mergedToken = { ...mergedToken, featuredImage: featuredImageUrl };
    }
  }

  return mergedToken;
}

/**
 * Clear metadata cache (useful for testing or forced refresh)
 */
export function clearTokenMetadataCache(): void {
  metadataCache.clear();
}
