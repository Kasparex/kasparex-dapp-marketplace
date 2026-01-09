/**
 * NFT Query Service
 * Queries user's NFTs from L1 (Kaspa) and L2 (Kasplex) wallets
 */

import { collections, type CollectionConfig } from './collections';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { createPublicClient, http, type Address } from 'viem';
import { kasplexL2Testnet, kasplexL2Mainnet } from '@/lib/wagmi';
import { fetchCollectionByTicker, type Krc721Collection } from './kaspa-com-api';
import { queryNFTsFromRegistry } from './registry-query';
import { fetchNFTsByAddress, filterNFTsByCollections } from './krc721-stream-api';

export interface UserNFT {
  tokenId: number;
  collection: string;
  collectionConfig: CollectionConfig;
  network: 'L1' | 'L2';
}

/**
 * Query NFTs from Kaspa L1 (KRC-721)
 * Uses KRC721 Stream API first, falls back to KaspaCom API, then IPFS registry if available
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
  
  // Try KRC721 Stream API first (most reliable)
  try {
    console.log('[NFT Query] Trying KRC721 Stream API...');
    const streamTokens = await fetchNFTsByAddress(address);
    const filteredTokens = filterNFTsByCollections(streamTokens, collectionIds);
    
    if (filteredTokens.length > 0) {
      console.log(`[NFT Query] ✓ KRC721 Stream API found ${filteredTokens.length} NFTs`);
      
      for (const token of filteredTokens) {
        const collectionId = token.ticker?.toUpperCase();
        const collection = collectionId ? collections[collectionId] : null;
        
        if (collection && token.tokenId !== undefined) {
          const tokenIdNum = typeof token.tokenId === 'number' 
            ? token.tokenId 
            : parseInt(String(token.tokenId), 10);
          
          if (!isNaN(tokenIdNum)) {
            results.push({
              tokenId: tokenIdNum,
              collection: collectionId,
              collectionConfig: collection,
              network: 'L1',
            });
          }
        }
      }
      
      if (results.length > 0) {
        console.log(`[NFT Query] ✓ Successfully loaded ${results.length} NFTs from KRC721 Stream API`);
        return results;
      }
    } else {
      console.log('[NFT Query] KRC721 Stream API returned no NFTs for requested collections');
    }
  } catch (error) {
    console.warn('[NFT Query] KRC721 Stream API failed, trying KaspaCom API fallback:', error);
  }
  
  // Fallback to KaspaCom API

  try {
    // Normalize address (remove kaspa: prefix for comparison)
    const normalizedAddress = address.replace(/^kaspa:/i, '').toLowerCase();

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
        // Try multiple address formats
        console.log(`[NFT Query] Searching for address ${address} (normalized: ${normalizedAddress}) in ${collectionId}`);
        console.log(`[NFT Query] Collection has ${collectionData.holders?.length || 0} holders`);
        
        // Log first few holder addresses for debugging
        if (collectionData.holders && collectionData.holders.length > 0) {
          const sampleHolders = collectionData.holders.slice(0, 10).map(h => ({
            address: h.walletAddress,
            tokenCount: h.tokenIds?.length || 0,
            normalized: (h.walletAddress || '').replace(/^kaspa:/i, '').toLowerCase(),
            raw: h.walletAddress
          }));
          console.log(`[NFT Query] Sample holder addresses:`, sampleHolders);
          console.log(`[NFT Query] Looking for normalized: "${normalizedAddress}"`);
          
          // Try to find a close match for debugging
          const closeMatch = sampleHolders.find(h => 
            h.normalized.includes(normalizedAddress.substring(0, 10)) || 
            normalizedAddress.includes(h.normalized.substring(0, 10))
          );
          if (closeMatch) {
            console.log(`[NFT Query] Found close match in samples:`, closeMatch);
          }
        }
        
        // Normalize address more carefully - handle various formats
        const normalizeAddress = (addr: string): string => {
          if (!addr) return '';
          // Remove kaspa: prefix (case insensitive)
          let normalized = addr.replace(/^kaspa:/i, '');
          // Remove any whitespace
          normalized = normalized.trim();
          // Convert to lowercase
          normalized = normalized.toLowerCase();
          return normalized;
        };
        
        const searchNormalized = normalizeAddress(address);
        console.log(`[NFT Query] Search normalized address: "${searchNormalized}"`);
        
        const holder = collectionData.holders.find((h) => {
          if (!h.walletAddress) return false;
          
          const holderNormalized = normalizeAddress(h.walletAddress);
          const matches = holderNormalized === searchNormalized;
          
          if (matches) {
            console.log(`[NFT Query] ✓ Found matching holder: ${h.walletAddress} (normalized: ${holderNormalized}) with ${h.tokenIds?.length || 0} tokens`);
          }
          
          return matches;
        });
        

        if (holder) {
          if (!holder.tokenIds || holder.tokenIds.length === 0) {
            console.warn(`Holder found but has no tokenIds for ${collectionId}`);
            continue;
          }

          console.log(`[NFT Query] ✓ Adding ${holder.tokenIds.length} tokens for ${collectionId}`);
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
        } else {
          console.log(`[NFT Query] ✗ No holder found for address ${address} in collection ${collectionId}`);
          console.log(`[NFT Query] Normalized search address: "${normalizedAddress}"`);
          console.log(`[NFT Query] Search normalized (new logic): "${searchNormalized}"`);
          
          // Debug: Check if address exists but format is different
          const allHolderAddresses = collectionData.holders.slice(0, 20).map(h => ({
            raw: h.walletAddress,
            normalized: normalizeAddress(h.walletAddress || ''),
            matches: normalizeAddress(h.walletAddress || '') === searchNormalized
          }));
          console.log(`[NFT Query] First 20 holder addresses for comparison:`, allHolderAddresses);
          
          // Try IPFS registry as fallback if available
          const collectionConfig = collections[collectionId];
          if (collectionConfig?.registryCid) {
            console.log(`[NFT Query] Trying IPFS registry fallback for ${collectionId}`);
            try {
              const registryNFTs = await queryNFTsFromRegistry(address, collectionConfig.registryCid, [collectionId]);
              if (registryNFTs.length > 0) {
                console.log(`[NFT Query] ✓ Found ${registryNFTs.length} NFTs via registry for ${collectionId}`);
                results.push(...registryNFTs);
              }
            } catch (registryError) {
              console.warn(`[NFT Query] Registry fallback failed:`, registryError);
            }
          }
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

      // Check if collection has L2 contract address configured
      // KREXPRIME and PIXELKREX are L1-only collections (KRC-721), so skip L2 querying
      // TODO: Add l2ContractAddress to CollectionConfig when L2 collections are available
      const l2ContractAddress = (collection as any).l2ContractAddress;
      
      if (!l2ContractAddress || l2ContractAddress === '0x0000000000000000000000000000000000000000') {
        // Collection doesn't have L2 contract, skip
        console.debug(`Collection ${collectionId} is L1-only, skipping L2 query`);
        continue;
      }

      try {
        // Create public client for contract reads
        // Use testnet by default, can be made configurable later
        const publicClient = createPublicClient({
          chain: kasplexL2Testnet,
          transport: http(),
        });

        // Get balance
        const balance = await publicClient.readContract({
          address: l2ContractAddress as Address,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        });

        // Handle unknown type from readContract
        let balanceNum = 0;
        if (typeof balance === 'bigint') {
          balanceNum = Number(balance);
        } else if (typeof balance === 'number') {
          balanceNum = balance;
        } else if (typeof balance === 'string') {
          balanceNum = parseInt(balance, 10);
        }

        if (balanceNum === 0) continue;

        // Get token IDs
        const tokenIds: number[] = [];
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await publicClient.readContract({
              address: l2ContractAddress as Address,
              abi: ERC721_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address as Address, BigInt(i)],
            });
            
            // Handle unknown type from readContract
            let tokenIdNum = 0;
            if (typeof tokenId === 'bigint') {
              tokenIdNum = Number(tokenId);
            } else if (typeof tokenId === 'number') {
              tokenIdNum = tokenId;
            } else if (typeof tokenId === 'string') {
              tokenIdNum = parseInt(tokenId, 10);
            }
            tokenIds.push(tokenIdNum);
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
 * Falls back to UTXO query if API query returns no results
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
    
    // If API query returned no results, try UTXO-based query as fallback
    // Note: UTXO parsing is complex and may not be fully implemented
    if (l1NFTs.length === 0) {
      console.log('[NFT Query] API query returned no NFTs, UTXO fallback not yet implemented');
      // TODO: Implement UTXO-based NFT detection
      // const utxoNFTs = await queryNFTsFromUtxos(l1Address, collectionIds);
      // results.push(...utxoNFTs);
    }
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

