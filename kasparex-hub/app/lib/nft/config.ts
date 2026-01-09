/**
 * NFT Configuration Constants
 * Defines Diamond and Rare NFT token IDs
 */

export const RARE_NFT_IDS = {
  KREXPRIME: [345],
  PIXELKREX: [515],
  // Additional rare IDs can be added here
};

export const DIAMOND_NFT_IDS = {
  KREXPRIME: [], // Fallback list if trait-based detection fails
  PIXELKREX: [], // Fallback list if trait-based detection fails
};

export const SUPPORTED_COLLECTIONS = ['KREXPRIME', 'PIXELKREX'] as const;

export type SupportedCollection = typeof SUPPORTED_COLLECTIONS[number];
