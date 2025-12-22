/**
 * NFT Query Service
 * Queries user's NFTs from L1 (Kaspa) and L2 (Kasplex) wallets
 */

import { collections, type CollectionConfig } from './collections';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { readContract } from '@wagmi/core';
import { config as wagmiConfig } from '@/lib/wagmi';

export interface UserNFT {
  tokenId: number;
  collection: string;
  collectionConfig: CollectionConfig;
  network: 'L1' | 'L2';
}

/**
 * Query NFTs from Kaspa L1 (KRC-721)
 * TODO: Implement actual KRC-721 query logic once API is available
 * This may require querying KaspaCom API or scanning UTXOs for NFT inscriptions
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
    // TODO: Implement actual NFT querying
    // Options:
    // 1. Query KaspaCom API for NFTs owned by address
    // 2. Scan UTXOs for NFT inscriptions
    // 3. Use a Kaspa NFT indexer service
    
    // Placeholder - will be implemented based on available APIs
    // Example structure:
    // const response = await fetch(`https://api.kaspa.com/nft/owner/${address}`);
    // const nfts = await response.json();
    // Filter by collection deployer and return results

    return results;
  } catch (error) {
    console.error('Error querying L1 NFTs:', error);
    return [];
  }
}

/**
 * Query NFTs from Kasplex L2 (EVM-compatible)
 * Uses ERC-721 standard contract calls
 */
export async function queryL2NFTs(
  address: string,
  collectionIds: string[] = ['KREXPRIME', 'PIXELKREX']
): Promise<UserNFT[]> {
  if (!address || !address.startsWith('0x')) {
    console.error('Invalid EVM address:', address);
    return [];
  }

  const results: UserNFT[] = [];

  try {
    // TODO: Get contract addresses for NFT collections on L2
    // For now, we'll need to know the contract addresses for KREXPRIME and PIXELKREX on Kasplex
    
    // Standard ERC-721 interface
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

      // TODO: Get actual contract address for collection on L2
      // For now, this is a placeholder
      const contractAddress = '0x0000000000000000000000000000000000000000'; // Placeholder

      try {
        // Get balance
        const balance = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        const balanceNum = Number(balance);
        if (balanceNum === 0) continue;

        // Get token IDs
        const tokenIds: number[] = [];
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await readContract(wagmiConfig, {
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address as `0x${string}`, BigInt(i)],
            });
            tokenIds.push(Number(tokenId));
          } catch (error) {
            console.warn(`Error fetching token ${i} for ${collectionId}:`, error);
          }
        }

        // Add to results
        tokenIds.forEach((tokenId) => {
          results.push({
            tokenId,
            collection: collectionId,
            collectionConfig: collection,
            network: 'L2',
          });
        });
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
  collectionIds: string[] = ['KREXPRIME', 'PIXELKREX']
): Promise<UserNFT[]> {
  const results: UserNFT[] = [];

  // Query L1 NFTs if address provided
  if (l1Address) {
    const l1NFTs = await queryL1NFTs(l1Address, collectionIds);
    results.push(...l1NFTs);
  }

  // Query L2 NFTs if address provided
  if (l2Address) {
    const l2NFTs = await queryL2NFTs(l2Address, collectionIds);
    results.push(...l2NFTs);
  }

  return results;
}

/**
 * Filter NFTs by collection
 */
export function filterNFTsByCollection(
  nfts: UserNFT[],
  collectionId: string
): UserNFT[] {
  return nfts.filter((nft) => nft.collection === collectionId);
}

/**
 * Group NFTs by collection
 */
export function groupNFTsByCollection(
  nfts: UserNFT[]
): Map<string, UserNFT[]> {
  const grouped = new Map<string, UserNFT[]>();

  nfts.forEach((nft) => {
    if (!grouped.has(nft.collection)) {
      grouped.set(nft.collection, []);
    }
    grouped.get(nft.collection)!.push(nft);
  });

  return grouped;
}

