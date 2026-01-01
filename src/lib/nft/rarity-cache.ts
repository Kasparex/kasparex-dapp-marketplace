/**
 * Rarity Cache Service
 * Pre-calculates and caches rarity scores for entire collections
 */

import type { ParsedNFTMetadata } from './metadata';
import type { NFTRarity, TraitRarity } from './rarity';
import { calculateNFTRarity, calculateCollectionRarity } from './rarity';
import {
  getCachedCollectionRarity,
  setCachedCollectionRarity,
  getCachedRarityScore,
  setCachedRarityScore,
} from './cache';

/**
 * Get rarity score for a single NFT
 * Uses cache if available, calculates if not
 */
export async function getNFTRarityCached(
  collectionId: string,
  tokenId: number,
  allMetadata: ParsedNFTMetadata[]
): Promise<NFTRarity | null> {
  // Check cache first
  const cached = await getCachedRarityScore<NFTRarity>(collectionId, tokenId);
  if (cached) {
    return cached;
  }

  // Find the NFT metadata
  const metadata = allMetadata.find((m) => m.tokenId === tokenId);
  if (!metadata) {
    return null;
  }

  // Calculate rarity
  const rarity = calculateNFTRarity(metadata, allMetadata);

  // Cache the result
  setCachedRarityScore(collectionId, tokenId, rarity).catch(console.error);

  return rarity;
}

/**
 * Get all rarity scores for a collection
 * Uses cache if available, calculates if not
 */
export async function getCollectionRarityCached(
  collectionId: string,
  allMetadata: ParsedNFTMetadata[]
): Promise<NFTRarity[]> {
  // Check cache first
  const cached = await getCachedCollectionRarity<NFTRarity[]>(collectionId);
  if (cached && cached.length === allMetadata.length) {
    // Verify cache matches current metadata count
    return cached;
  }

  // Calculate rarity for all NFTs
  const rarityScores = calculateCollectionRarity(allMetadata);

  // Cache individual scores and full collection
  rarityScores.forEach((rarity) => {
    setCachedRarityScore(collectionId, rarity.tokenId, rarity).catch(console.error);
  });
  setCachedCollectionRarity(collectionId, rarityScores).catch(console.error);

  return rarityScores;
}

/**
 * Pre-calculate and cache rarity for entire collection
 * Useful for background processing
 */
export async function precalculateCollectionRarity(
  collectionId: string,
  allMetadata: ParsedNFTMetadata[]
): Promise<NFTRarity[]> {
  return getCollectionRarityCached(collectionId, allMetadata);
}

/**
 * Get rarity rank for a specific NFT
 */
export async function getNFTRank(
  collectionId: string,
  tokenId: number,
  allMetadata: ParsedNFTMetadata[]
): Promise<number | null> {
  const rarityScores = await getCollectionRarityCached(collectionId, allMetadata);
  const rarity = rarityScores.find((r) => r.tokenId === tokenId);
  return rarity?.rank || null;
}

