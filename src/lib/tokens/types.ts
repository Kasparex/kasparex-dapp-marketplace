/**
 * Token Type Definitions
 * Comprehensive interface for ecosystem tokens (KREX, GRID, collab tokens, UaaS listings).
 * GRID: see docs/GRID_CANONICAL_SUPPLY_MODEL.md (L1 canonical KRC-20 + bridged L2 ERC-20 representations).
 */

export type TokenNetwork = 'L1' | 'L2';
export type TokenType = 'global' | 'collab';

/** Listing signals for directory badges, sorting, and premium placement. */
export type TokenListingStatus = {
  verified?: boolean;
  instantUtility?: boolean;
  featured?: boolean;
  utilityBadges?: string[];
  activityScore?: number;
  communityScore?: number;
};

export interface TokenLink {
  label: string;
  url: string;
  type?: 'website' | 'explorer' | 'social' | 'whitepaper' | 'other';
}

export interface TokenAllocation {
  category: string; // e.g., "Use-to-mint", "Liquidity", "Treasury", "Dev", "Airdrops"
  percentage: number; // Percentage of total supply (0-100)
  amount?: number; // Absolute amount (if available)
  description?: string;
}

export interface RoadmapEvent {
  date: string; // ISO date string or "Q1 2024" format
  title: string;
  description: string;
  status?: 'completed' | 'in-progress' | 'upcoming';
}

export interface PriceData {
  current: number; // Current price in USD
  change24h?: number; // 24h price change percentage
  change7d?: number; // 7d price change percentage
  marketCap?: number; // Market capitalization
  volume24h?: number; // 24h trading volume
  lastUpdated?: string; // ISO timestamp
}

export interface Token {
  // Basic Info
  id: string; // Unique identifier
  slug: string; // URL-friendly identifier
  name: string; // Full token name
  symbol: string; // Token symbol (e.g., "KREX", "GRID")
  description: string; // Full description
  shortDescription?: string; // Brief description for cards/tables
  
  // Images
  logo?: string; // Logo image URL or IPFS CID
  logoCid?: string; // IPFS CID for logo
  featuredImage?: string; // Featured image URL or IPFS CID
  featuredImageCid?: string; // IPFS CID for featured image
  
  // Network Info
  network: TokenNetwork; // L1 (Kaspa) or L2 (EVM)
  chainId?: number; // Chain ID for L2 tokens
  contractAddress?: string; // Contract address (L1 or L2)
  l1Address?: string; // L1 contract address (if token exists on both)
  l2Address?: string; // L2 contract address (if token exists on both)
  
  // Token Type
  type: TokenType; // global or collab
  
  // Tokenomics
  totalSupply?: number; // Total supply
  maxSupply?: number; // Maximum supply (if capped)
  circulatingSupply?: number; // Circulating supply
  decimals?: number; // Token decimals (default 18 for ERC20, 8 for KRC20)
  allocations?: TokenAllocation[]; // Token distribution breakdown
  
  // Roadmap
  roadmap?: RoadmapEvent[]; // Timeline of milestones
  
  // Ecosystem relations
  relatedDAppIds?: string[]; // Optional linked Kasparex dApps
  
  // Price Data
  price?: PriceData; // Current price information
  
  // Links
  links?: TokenLink[]; // External links (website, explorer, social)
  
  // IPFS Metadata
  metadataCid?: string; // IPFS CID for token metadata JSON
  
  // Additional Metadata
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  tags?: string[]; // Tags for categorization
  whitepaperUrl?: string; // Official whitepaper download URL

  /** Directory listing badges, scores, and premium signals. */
  listing?: TokenListingStatus;
}

/**
 * Token metadata structure stored on IPFS
 */
export interface TokenIPFSMetadata {
  name: string;
  symbol: string;
  description: string;
  logoCid?: string;
  featuredImageCid?: string;
  allocations?: TokenAllocation[];
  roadmap?: RoadmapEvent[];
  relatedDAppIds?: string[];
  links?: TokenLink[];
  tags?: string[];
  whitepaperUrl?: string;
}
