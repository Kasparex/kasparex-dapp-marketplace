/**
 * NFT Query Service
 * Queries user's NFTs from L1 (Kaspa) and L2 (Kasplex) wallets
 */

import {
  collections,
  getAllSupportedCollectionIds,
  resolveCollectionIdFromTick,
  type CollectionConfig,
} from './collections';
import { isValidKaspaAddress, normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { createPublicClient, http, type Address } from 'viem';
import { kasplexL2Testnet } from '@/lib/wagmi';
import { fetchCollectionByTicker } from './kaspa-com-api';
import { queryNFTsFromRegistry } from './registry-query';
import { fetchNFTsByAddress } from './krc721-stream-api';

export interface UserNFT {
  tokenId: number;
  collection: string;
  collectionConfig: CollectionConfig;
  network: 'L1' | 'L2';
}

function normalizeQueryAddress(address: string): string | null {
  if (!address?.trim()) return null;
  try {
    const normalized = normalizeKaspaAddress(address);
    return isValidKaspaAddress(normalized) ? normalized : null;
  } catch {
    const withPrefix = address.trim().startsWith('kaspa:') ? address.trim() : `kaspa:${address.trim()}`;
    return isValidKaspaAddress(withPrefix) ? withPrefix : null;
  }
}

function normalizeHolderAddress(addr: string): string {
  if (!addr) return '';
  return addr.replace(/^kaspa:/i, '').trim().toLowerCase();
}

function parseTokenId(tokenId: string | number | undefined): number | null {
  if (tokenId === undefined || tokenId === null) return null;
  const tokenIdNum = typeof tokenId === 'number' ? tokenId : parseInt(String(tokenId), 10);
  return Number.isFinite(tokenIdNum) && !Number.isNaN(tokenIdNum) ? tokenIdNum : null;
}

function userNftKey(collection: string, tokenId: number): string {
  return `${collection}-${tokenId}`;
}

async function queryCollectionFromKaspaCom(
  collectionId: string,
  normalizedAddress: string,
): Promise<UserNFT[]> {
  const collection = collections[collectionId];
  if (!collection) return [];

  const results: UserNFT[] = [];

  try {
    const collectionData = await fetchCollectionByTicker(collectionId);
    if (!collectionData?.holders?.length) return results;

    const searchNormalized = normalizeHolderAddress(normalizedAddress);
    const holder = collectionData.holders.find((h) => {
      if (!h.walletAddress) return false;
      return normalizeHolderAddress(h.walletAddress) === searchNormalized;
    });

    if (!holder?.tokenIds?.length) return results;

    holder.tokenIds.forEach((tokenId) => {
      const tokenIdNum = parseTokenId(tokenId);
      if (tokenIdNum !== null) {
        results.push({
          tokenId: tokenIdNum,
          collection: collectionId,
          collectionConfig: collection,
          network: 'L1',
        });
      }
    });
  } catch (error) {
    console.error(`Error querying L1 NFTs for ${collectionId}:`, error);
  }

  return results;
}

/**
 * Query NFTs from Kaspa L1 (KRC-721)
 * Uses KRC721 Stream API first, falls back to KaspaCom API per collection, then IPFS registry if available
 */
export async function queryL1NFTs(
  address: string,
  collectionIds: string[] = getAllSupportedCollectionIds(),
): Promise<UserNFT[]> {
  const normalizedAddress = normalizeQueryAddress(address);
  if (!normalizedAddress) {
    console.error('[NFT Query] Invalid Kaspa address:', address);
    return [];
  }

  const results: UserNFT[] = [];
  const seen = new Set<string>();
  const foundCollections = new Set<string>();

  const addResults = (items: UserNFT[]) => {
    for (const item of items) {
      const key = userNftKey(item.collection, item.tokenId);
      if (seen.has(key)) continue;
      seen.add(key);
      foundCollections.add(item.collection);
      results.push(item);
    }
  };

  // KRC721 Stream API (paginated)
  try {
    const streamTokens = await fetchNFTsByAddress(normalizedAddress);
    const streamResults: UserNFT[] = [];

    for (const token of streamTokens) {
      const collectionId = resolveCollectionIdFromTick(token.tick);
      if (!collectionId || !collectionIds.includes(collectionId)) continue;

      const collection = collections[collectionId];
      const tokenIdNum = parseTokenId(token.tokenId);
      if (!collection || tokenIdNum === null) continue;

      streamResults.push({
        tokenId: tokenIdNum,
        collection: collectionId,
        collectionConfig: collection,
        network: 'L1',
      });
    }

    if (streamResults.length > 0) {
      addResults(streamResults);
    }
  } catch (error) {
    console.warn('[NFT Query] KRC721 Stream API failed, trying KaspaCom API fallback:', error);
  }

  // KaspaCom fallback for collections with no Stream hits
  const missingCollections =
    foundCollections.size === 0 ? collectionIds : collectionIds.filter((id) => !foundCollections.has(id));

  for (const collectionId of missingCollections) {
    const kaspaComResults = await queryCollectionFromKaspaCom(collectionId, normalizedAddress);
    addResults(kaspaComResults);

    if (!foundCollections.has(collectionId)) {
      const collectionConfig = collections[collectionId];
      if (collectionConfig?.registryCid) {
        try {
          const registryNFTs = await queryNFTsFromRegistry(normalizedAddress, collectionConfig.registryCid, [collectionId]);
          addResults(registryNFTs);
        } catch (registryError) {
          console.warn(`[NFT Query] Registry fallback failed for ${collectionId}:`, registryError);
        }
      }
    }
  }

  return results;
}

/**
 * Query NFTs from Kasplex L2 (EVM-compatible)
 */
export async function queryL2NFTs(
  address: string,
  collectionIds: string[] = getAllSupportedCollectionIds(),
): Promise<UserNFT[]> {
  if (!address || !address.startsWith('0x')) {
    return [];
  }

  const results: UserNFT[] = [];

  try {
    const ERC721_ABI = [
      {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'index', type: 'uint256' },
        ],
        name: 'tokenOfOwnerByIndex',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const;

    for (const collectionId of collectionIds) {
      const collection = collections[collectionId];
      if (!collection) continue;

      const l2ContractAddress = (collection as CollectionConfig & { l2ContractAddress?: string }).l2ContractAddress;
      if (!l2ContractAddress || l2ContractAddress === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      try {
        const publicClient = createPublicClient({
          chain: kasplexL2Testnet,
          transport: http(),
        });

        const balance = await publicClient.readContract({
          address: l2ContractAddress as Address,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        });

        let balanceNum = 0;
        if (typeof balance === 'bigint') balanceNum = Number(balance);
        else if (typeof balance === 'number') balanceNum = balance;
        else if (typeof balance === 'string') balanceNum = parseInt(balance, 10);

        if (balanceNum === 0) continue;

        for (let i = 0; i < balanceNum; i += 1) {
          try {
            const tokenId = await publicClient.readContract({
              address: l2ContractAddress as Address,
              abi: ERC721_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address as Address, BigInt(i)],
            });

            let tokenIdNum = 0;
            if (typeof tokenId === 'bigint') tokenIdNum = Number(tokenId);
            else if (typeof tokenId === 'number') tokenIdNum = tokenId;
            else if (typeof tokenId === 'string') tokenIdNum = parseInt(tokenId, 10);

            results.push({
              tokenId: tokenIdNum,
              collection: collectionId,
              collectionConfig: collection,
              network: 'L2',
            });
          } catch (error) {
            console.warn(`Error fetching token ${i} for ${collectionId}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Error querying L2 NFTs for ${collectionId}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error querying L2 NFTs:', error);
    return [];
  }
}

/**
 * Query NFTs from both L1 and L2
 */
export async function queryUserNFTs(
  l1Address: string | null,
  l2Address: string | null,
  collectionIds?: string[],
): Promise<UserNFT[]> {
  const ids = collectionIds ?? getAllSupportedCollectionIds();
  const results: UserNFT[] = [];

  if (l1Address) {
    const l1NFTs = await queryL1NFTs(l1Address, ids);
    results.push(...l1NFTs);
  }

  if (l2Address) {
    const l2NFTs = await queryL2NFTs(l2Address, ids);
    results.push(...l2NFTs);
  }

  return results;
}

export function filterNFTsByCollection(nfts: UserNFT[], collectionId: string): UserNFT[] {
  return nfts.filter((nft) => nft.collection === collectionId);
}

export function groupNFTsByCollection(nfts: UserNFT[]): Map<string, UserNFT[]> {
  const grouped = new Map<string, UserNFT[]>();

  nfts.forEach((nft) => {
    if (!grouped.has(nft.collection)) {
      grouped.set(nft.collection, []);
    }
    grouped.get(nft.collection)!.push(nft);
  });

  return grouped;
}
