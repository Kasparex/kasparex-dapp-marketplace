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

/** PIXELKREX: trait_type is "Diamonds"; value starts with one of these (plan: metadata CID bafybeiakbvm7hn6ev23tiorgdxh3hcjkuu7huxdijklybastzmceclycnu). */
const PIXELKREX_DIAMOND_VALUE_PREFIXES = [
  'Cipher Prism Diamond',
  'Ecliptic Flame Diamond',
  'Aurora Core Diamond',
  'Chrono Shard Diamond',
  'Eon Core Diamond',
];

/**
 * Check if NFT has Diamond trait (for PIXELKREX)
 * Exact: trait_type === "Diamonds" and value starts with one of the five element names (or normalize by splitting on " - ").
 */
function hasDiamondTrait(metadata: ParsedNFTMetadata | null): boolean {
  if (!metadata || !metadata.traits) return false;

  return metadata.traits.some((trait) => {
    const traitType = String(trait.trait_type || '').trim();
    if (traitType !== 'Diamonds') return false;
    const value = String(trait.value || '').trim();
    const prefix = value.split(' - ')[0].trim();
    return PIXELKREX_DIAMOND_VALUE_PREFIXES.some((p) => prefix === p || value.startsWith(p));
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
