/**
 * NFT Query via IPFS Registry/Index
 * Queries user's NFTs from an IPFS-based registry file
 */

import { fetchJSON } from '@/lib/ipfs/gateway';
import { collections, type CollectionConfig } from './collections';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';

/**
 * Normalize Kaspa address for comparison
 */
function normalizeKaspaAddress(address: string): string {
  return address.replace(/^kaspa:/i, '').toLowerCase().trim();
}
import type { UserNFT } from './nft-query';

export interface RegistryEntry {
  address: string;
  tokenIds: number[];
  collection: string;
}

export interface NFTRegistry {
  [collectionId: string]: {
    [address: string]: number[]; // address -> token IDs
  };
}

/**
 * Query NFTs from IPFS registry file
 * Registry format: { [collectionId]: { [address]: [tokenIds] } }
 */
export async function queryNFTsFromRegistry(
  address: string,
  registryCid: string,
  collectionIds: string[] = ['KREXPRIME', 'PIXELKREX']
): Promise<UserNFT[]> {
  if (!isValidKaspaAddress(address)) {
    console.error('Invalid Kaspa address:', address);
    return [];
  }

  const results: UserNFT[] = [];
  const normalizedAddress = normalizeKaspaAddress(address);

  try {
    console.log('[Registry NFT Query] Fetching registry from IPFS:', registryCid);
    const registry = await fetchJSON<NFTRegistry>(registryCid);
    
    if (!registry) {
      console.warn('[Registry NFT Query] Registry not found or invalid');
      return [];
    }

    console.log('[Registry NFT Query] Registry loaded:', Object.keys(registry));

    for (const collectionId of collectionIds) {
      const collection = collections[collectionId];
      if (!collection) continue;

      const collectionData = registry[collectionId];
      if (!collectionData) {
        console.warn(`[Registry NFT Query] Collection ${collectionId} not found in registry`);
        continue;
      }

      // Find matching address (try normalized and original)
      const matchingTokenIds = collectionData[normalizedAddress] || 
                                collectionData[address] ||
                                collectionData[address.toLowerCase()] ||
                                collectionData[address.replace(/^kaspa:/i, '')];

      if (matchingTokenIds && Array.isArray(matchingTokenIds) && matchingTokenIds.length > 0) {
        console.log(`[Registry NFT Query] Found ${matchingTokenIds.length} NFTs for ${collectionId}`);
        
        matchingTokenIds.forEach((tokenId) => {
          const tokenIdNum = typeof tokenId === 'number' ? tokenId : parseInt(String(tokenId), 10);
          if (!isNaN(tokenIdNum)) {
            results.push({
              tokenId: tokenIdNum,
              collection: collectionId,
              collectionConfig: collection,
              network: 'L1',
            });
          }
        });
      } else {
        console.log(`[Registry NFT Query] No NFTs found for address in ${collectionId}`);
      }
    }

    return results;
  } catch (error) {
    console.error('[Registry NFT Query] Error fetching registry:', error);
    return [];
  }
}
