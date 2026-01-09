/**
 * NFT Query Service for Hub
 * Queries user's NFTs from L1 (Kaspa) collections
 */

import { collections, type CollectionConfig } from './collections';
import { isValidKaspaAddress, normalizeKaspaAddress } from './utils';
import { fetchCollectionByTicker, type Krc721Collection } from './kaspa-com-api';

export interface UserNFT {
  tokenId: number;
  collection: string;
  collectionConfig: CollectionConfig;
  network: 'L1' | 'L2';
}

/**
 * Query NFTs from Kaspa L1 (KRC-721)
 * Uses KaspaCom API to fetch collection data and filter by wallet address
 */
export async function queryL1NFTs(
  address: string,
  collectionIds: string[] = ['KREXPRIME', 'PIXELKREX']
): Promise<UserNFT[]> {
  if (!isValidKaspaAddress(address)) {
    console.error('Invalid Kaspa address:', address);
    return [];
  }

  const results: UserNFT[] = [];

  try {
    // Normalize address (remove kaspa: prefix for comparison)
    const normalizedAddress = normalizeKaspaAddress(address);

    // Query each collection
    for (const collectionId of collectionIds) {
      const collection = collections[collectionId];
      if (!collection) continue;

      try {
        // Fetch collection data from KaspaCom API
        const collectionData = await fetchCollectionByTicker(collectionId);
        if (!collectionData) {
          console.warn(`Collection ${collectionId} data not found`);
          continue;
        }

        if (!collectionData.holders || collectionData.holders.length === 0) {
          console.warn(`Collection ${collectionId} has no holders data`);
          continue;
        }

        // Find holder matching the address
        const holder = collectionData.holders.find((h) => {
          const holderAddress = normalizeKaspaAddress(h.walletAddress || '');
          return holderAddress === normalizedAddress;
        });

        if (holder) {
          if (!holder.tokenIds || holder.tokenIds.length === 0) {
            console.warn(`Holder found but has no tokenIds for ${collectionId}`);
            continue;
          }

          // Add all token IDs owned by this address
          holder.tokenIds.forEach((tokenId) => {
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
        }
      } catch (error) {
        console.error(`Error querying L1 NFTs for ${collectionId}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error querying L1 NFTs:', error);
    return [];
  }
}
