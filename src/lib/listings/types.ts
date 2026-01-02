/**
 * Kasparex Index - Listing Types and Interfaces
 */

export enum ListingCategory {
  DAPPS = 'dApps',
  TOKENS = 'Tokens',
  NFTS = 'NFTs',
  TOOLS = 'Tools',
  GAMES = 'Games',
  MEDIA = 'Media',
  DEFI = 'DeFi',
  INFRASTRUCTURE = 'Infrastructure',
}

export type ListingStatus = 'active' | 'pending' | 'archived';

export interface ListingLinks {
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
}

export interface ListingImages {
  logoCid?: string;
  bannerCid?: string;
}

/**
 * Metadata structure stored on IPFS
 */
export interface ListingMetadata {
  name: string;
  description: string;
  category: ListingCategory;
  tags: string[];
  links: ListingLinks;
  images: ListingImages;
  version: string;
}

/**
 * Listing interface (used in frontend)
 * Combines on-chain data with IPFS metadata
 */
export interface Listing {
  id: string; // Transaction hash
  ipfsCid: string; // IPFS CID for metadata JSON
  name: string; // From IPFS metadata
  description: string; // From IPFS metadata
  category: ListingCategory;
  tags: string[]; // From IPFS metadata
  ownerWallet: string; // From transaction
  timestamp: number; // From transaction
  links: ListingLinks; // From IPFS metadata
  images: ListingImages; // IPFS CIDs, resolved to URLs via resolveAsset()
  status: ListingStatus;
}

/**
 * Form data for creating/editing listings
 */
export interface CreateListingFormData {
  name: string;
  description: string;
  category: ListingCategory;
  tags: string[];
  links: ListingLinks;
  logoFile?: File;
  bannerFile?: File;
}

/**
 * Filters for listing queries
 */
export interface ListingFilters {
  category?: ListingCategory;
  tags?: string[];
  status?: ListingStatus;
  search?: string;
  ownerWallet?: string;
}

/**
 * API response for listing operations
 */
export interface ListingResponse {
  listing: Listing;
  metadata?: ListingMetadata; // Optional, fetched from IPFS
}

