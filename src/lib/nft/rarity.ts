/**
 * NFT Rarity Calculation
 * Implements standard rarity scoring algorithm
 */

import type { ParsedNFTMetadata, NFTTrait } from './metadata';

export interface TraitRarity {
  traitType: string;
  value: string | number;
  count: number;
  percentage: number;
  rarityScore: number;
}

export interface NFTRarity {
  tokenId: number;
  totalRarityScore: number;
  traitRarities: TraitRarity[];
  rank?: number;
}

/**
 * Calculate rarity for a single trait across the collection
 */
function calculateTraitRarity(
  traitType: string,
  value: string | number,
  allTraits: Map<string, Map<string | number, number>>,
  totalNFTs: number
): TraitRarity {
  const traitCounts = allTraits.get(traitType);
  const count = traitCounts?.get(value) || 0;
  const percentage = totalNFTs > 0 ? (count / totalNFTs) * 100 : 0;
  
  // Standard rarity formula: rarity_score = 1 / (trait_frequency / total_nfts)
  // Which simplifies to: rarity_score = total_nfts / trait_frequency
  const rarityScore = count > 0 ? totalNFTs / count : 0;

  return {
    traitType,
    value,
    count,
    percentage,
    rarityScore,
  };
}

/**
 * Build trait frequency map from NFT metadata
 */
function buildTraitFrequencyMap(metadataList: ParsedNFTMetadata[]): Map<string, Map<string | number, number>> {
  const traitMap = new Map<string, Map<string | number, number>>();

  metadataList.forEach((metadata) => {
    metadata.traits.forEach((trait) => {
      const traitType = trait.trait_type;
      const value = trait.value;

      if (!traitMap.has(traitType)) {
        traitMap.set(traitType, new Map());
      }

      const valueMap = traitMap.get(traitType)!;
      const currentCount = valueMap.get(value) || 0;
      valueMap.set(value, currentCount + 1);
    });
  });

  return traitMap;
}

/**
 * Calculate rarity for a single NFT
 */
export function calculateNFTRarity(
  metadata: ParsedNFTMetadata,
  allMetadata: ParsedNFTMetadata[]
): NFTRarity {
  const traitFrequencyMap = buildTraitFrequencyMap(allMetadata);
  const totalNFTs = allMetadata.length;

  const traitRarities: TraitRarity[] = metadata.traits.map((trait) =>
    calculateTraitRarity(trait.trait_type, trait.value, traitFrequencyMap, totalNFTs)
  );

  // Total rarity is the sum of all trait rarity scores
  const totalRarityScore = traitRarities.reduce((sum, trait) => sum + trait.rarityScore, 0);

  return {
    tokenId: metadata.tokenId,
    totalRarityScore,
    traitRarities,
  };
}

/**
 * Calculate rarity for all NFTs in a collection
 */
export function calculateCollectionRarity(
  metadataList: ParsedNFTMetadata[]
): NFTRarity[] {
  const rarityResults = metadataList.map((metadata) =>
    calculateNFTRarity(metadata, metadataList)
  );

  // Sort by rarity score (highest first)
  rarityResults.sort((a, b) => b.totalRarityScore - a.totalRarityScore);

  // Assign ranks
  rarityResults.forEach((rarity, index) => {
    rarity.rank = index + 1;
  });

  return rarityResults;
}

/**
 * Get rarity for a specific NFT by token ID
 */
export function getNFTRarity(
  tokenId: number,
  rarityList: NFTRarity[]
): NFTRarity | undefined {
  return rarityList.find((rarity) => rarity.tokenId === tokenId);
}

