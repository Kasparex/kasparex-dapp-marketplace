/**
 * Trait Analysis Utilities
 * Calculate trait percentages, frequencies, and distributions
 */

import type { ParsedNFTMetadata, NFTTrait } from './metadata';

export interface TraitFrequency {
  traitType: string;
  value: string | number;
  count: number;
  percentage: number;
}

export interface TraitTypeStats {
  traitType: string;
  totalCount: number;
  uniqueValues: number;
  frequencies: TraitFrequency[];
}

export interface CollectionTraitStats {
  totalNFTs: number;
  traitTypes: TraitTypeStats[];
}

/**
 * Calculate trait frequencies for a collection
 */
export function calculateTraitFrequencies(
  metadataList: ParsedNFTMetadata[]
): CollectionTraitStats {
  const traitTypeMap = new Map<string, Map<string | number, number>>();
  const totalNFTs = metadataList.length;

  // Count trait occurrences
  metadataList.forEach((metadata) => {
    metadata.traits.forEach((trait) => {
      const traitType = trait.trait_type;
      const value = trait.value;

      if (!traitTypeMap.has(traitType)) {
        traitTypeMap.set(traitType, new Map());
      }

      const valueMap = traitTypeMap.get(traitType)!;
      const currentCount = valueMap.get(value) || 0;
      valueMap.set(value, currentCount + 1);
    });
  });

  // Build trait type stats
  const traitTypes: TraitTypeStats[] = Array.from(traitTypeMap.entries()).map(
    ([traitType, valueMap]) => {
      const frequencies: TraitFrequency[] = Array.from(valueMap.entries()).map(
        ([value, count]) => ({
          traitType,
          value,
          count,
          percentage: totalNFTs > 0 ? (count / totalNFTs) * 100 : 0,
        })
      );

      // Sort by count (most common first)
      frequencies.sort((a, b) => b.count - a.count);

      return {
        traitType,
        totalCount: totalNFTs,
        uniqueValues: valueMap.size,
        frequencies,
      };
    }
  );

  // Sort trait types alphabetically
  traitTypes.sort((a, b) => a.traitType.localeCompare(b.traitType));

  return {
    totalNFTs,
    traitTypes,
  };
}

/**
 * Get trait frequency for a specific trait
 */
export function getTraitFrequency(
  traitType: string,
  value: string | number,
  stats: CollectionTraitStats
): TraitFrequency | undefined {
  const traitTypeStats = stats.traitTypes.find((tt) => tt.traitType === traitType);
  return traitTypeStats?.frequencies.find((f) => f.value === value);
}

/**
 * Get all unique values for a trait type
 */
export function getTraitValues(
  traitType: string,
  stats: CollectionTraitStats
): Array<string | number> {
  const traitTypeStats = stats.traitTypes.find((tt) => tt.traitType === traitType);
  return traitTypeStats?.frequencies.map((f) => f.value) || [];
}

/**
 * Get most common traits
 */
export function getMostCommonTraits(
  stats: CollectionTraitStats,
  limit = 10
): TraitFrequency[] {
  const allFrequencies: TraitFrequency[] = [];
  
  stats.traitTypes.forEach((traitType) => {
    allFrequencies.push(...traitType.frequencies);
  });

  // Sort by count and return top N
  allFrequencies.sort((a, b) => b.count - a.count);
  return allFrequencies.slice(0, limit);
}

/**
 * Get rarest traits
 */
export function getRarestTraits(
  stats: CollectionTraitStats,
  limit = 10
): TraitFrequency[] {
  const allFrequencies: TraitFrequency[] = [];
  
  stats.traitTypes.forEach((traitType) => {
    allFrequencies.push(...traitType.frequencies);
  });

  // Sort by count (lowest first) and return top N
  allFrequencies.sort((a, b) => a.count - b.count);
  return allFrequencies.slice(0, limit);
}

/**
 * Get trait distribution for a specific trait type
 */
export function getTraitDistribution(
  traitType: string,
  stats: CollectionTraitStats
): TraitFrequency[] {
  const traitTypeStats = stats.traitTypes.find((tt) => tt.traitType === traitType);
  return traitTypeStats?.frequencies || [];
}

