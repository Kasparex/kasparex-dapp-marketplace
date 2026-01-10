/**
 * Diamond NFT Detection
 * Detects Diamond NFTs for KREXPRIME and PIXELKREX collections
 */

import type { ParsedNFTMetadata } from './metadata';

/**
 * KREXPRIME Diamond Elements
 * These are the 5 Diamond elements in the ELEMENTS trait type
 * Values in metadata may have numeric suffixes like "Chrono Shard - 1", "Ecliptic Flame - 2", etc.
 */
const KREXPRIME_DIAMOND_ELEMENTS = [
  'Chrono Shard',
  'Ecliptic Flame',
  'Cipher Prism',
  'Aurora Core',
  'Eon Core',
];

/**
 * Check if a value matches a Diamond element (handles numeric suffixes)
 * Examples: "Chrono Shard - 1" matches "Chrono Shard", "Ecliptic Flame - 2" matches "Ecliptic Flame"
 */
function matchesDiamondElement(value: string, diamondElement: string): boolean {
  const normalizedValue = value.toLowerCase().trim();
  const normalizedElement = diamondElement.toLowerCase().trim();
  
  // Exact match
  if (normalizedValue === normalizedElement) return true;
  
  // Match with numeric suffix (e.g., "Chrono Shard - 1" matches "Chrono Shard")
  const suffixPattern = /^(.+?)\s*-\s*\d+$/;
  const match = normalizedValue.match(suffixPattern);
  if (match) {
    const baseValue = match[1].trim();
    return baseValue === normalizedElement;
  }
  
  // Match if value starts with the element name (handles any suffix)
  return normalizedValue.startsWith(normalizedElement + ' -') || normalizedValue.startsWith(normalizedElement + '-');
}

/**
 * Check if NFT has Diamond trait (for PIXELKREX)
 * Looks for trait_type containing "diamond"
 */
function hasDiamondTrait(metadata: ParsedNFTMetadata | null): boolean {
  if (!metadata || !metadata.traits) return false;
  
  return metadata.traits.some((trait) => {
    const traitType = String(trait.trait_type || '').toLowerCase();
    return traitType.includes('diamond');
  });
}

/**
 * Check if NFT has KREXPRIME Diamond Element (for KREXPRIME)
 * Looks for ELEMENTS trait type with one of the 5 Diamond element values
 */
function hasKREXPRIMEDiamondElement(metadata: ParsedNFTMetadata | null): boolean {
  if (!metadata || !metadata.traits) return false;
  
  return metadata.traits.some((trait) => {
    const traitType = String(trait.trait_type || '').toUpperCase();
    const traitValue = String(trait.value || '').trim();
    
    // Check if trait type is ELEMENTS and value is one of the Diamond elements
    if (traitType === 'ELEMENTS' || traitType === 'ELEMENT') {
      return KREXPRIME_DIAMOND_ELEMENTS.some(
        (diamondElement) => matchesDiamondElement(traitValue, diamondElement)
      );
    }
    
    return false;
  });
}

/**
 * Check if an NFT is a Diamond NFT
 * @param collectionId - Collection ID (KREXPRIME or PIXELKREX)
 * @param metadata - NFT metadata
 * @returns true if NFT is a Diamond NFT
 */
export function isDiamondNFT(
  collectionId: string,
  metadata: ParsedNFTMetadata | null
): boolean {
  if (!metadata) return false;
  
  if (collectionId === 'KREXPRIME') {
    return hasKREXPRIMEDiamondElement(metadata);
  } else if (collectionId === 'PIXELKREX') {
    return hasDiamondTrait(metadata);
  }
  
  return false;
}
