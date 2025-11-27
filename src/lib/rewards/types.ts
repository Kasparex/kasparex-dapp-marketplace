/**
 * Types for the Reward Calculator
 */

export type KREXTier = 'Tier0' | 'Tier1' | 'Tier2' | 'Tier3';

export interface KREXTierConfig {
  tier: KREXTier;
  minKREX: number;
  multiplier: number;
  feePercent: number;
  pointsMultiplier: number;
  label: string;
  description: string;
}

export interface NFTStatus {
  hasKREXPRIME: boolean;
  hasPIXELKREX: boolean;
  hasDiamondKREXPRIME: boolean;
  hasDiamondPIXELKREX: boolean;
  hasRarestNFT: boolean; // NFT #515 from PIXELKREX or #345 from KREXPRIME
}

export interface CustomBaseRewards {
  grtPerKas: number;
  lrtPerKas: number;
  xpPerKas: number;
  useCustom: boolean;
}

export interface NodeProviderStatus {
  isNodeProvider: boolean;
  nodeMultiplier: number; // e.g., 5x
  nodeFeeReduction: number; // percentage reduction
}

export interface FeeSettings {
  baseFeePercent: number; // Default base fee percentage (e.g., 1%)
  useCustomDistribution: boolean;
  kasparexPercent: number; // Default 60%
  grtTreasuryPercent: number; // Default 20%
  lrtTreasuryPercent: number; // Default 20%
}

export interface SupplyMetrics {
  grtMaxSupply: number; // Default 100B
  lrtMaxSupply: number; // Default 100M
  dailyKasSpent: number; // Default 1000 KAS
  numberOfUsers: number; // Number of active users
  grtMinted: number; // Already minted GRT (for progress bar)
  lrtMinted: number; // Already minted LRT (for progress bar)
}

export interface CalculatorInputs {
  kasAmount: number;
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  seasonalBoost: number; // percentage (0-100)
  customBaseRewards: CustomBaseRewards;
  nodeProvider: NodeProviderStatus;
  feeSettings: FeeSettings;
}

export interface RewardResult {
  // Base rewards (before multipliers)
  baseGRT: number;
  baseLRT: number;
  baseXP: number;
  
  // Final rewards (after multipliers)
  finalGRT: number;
  finalLRT: number;
  finalXP: number;
  
  // Multipliers breakdown
  krexMultiplier: number;
  nftMultiplier: number; // From NFT ownership
  nodeMultiplier: number; // From node provider status
  seasonalMultiplier: number;
  totalMultiplier: number; // All multipliers combined
  
  // Fees
  feePercent: number;
  feeAmount: number;
  feeDistribution: {
    kasparex: number;
    grtTreasury: number;
    lrtTreasury: number;
  };
  
  // Points
  pointsMultiplier: number;
  
  // Supply exhaustion calculations
  supplyMetrics?: {
    daysUntilGRTExhaustion: number;
    daysUntilLRTExhaustion: number;
    grtProgress: number; // Percentage minted
    lrtProgress: number; // Percentage minted
    dailyGRTEmission: number;
    dailyLRTEmission: number;
  };
}

export const KREX_TIERS: Record<KREXTier, KREXTierConfig> = {
  Tier0: {
    tier: 'Tier0',
    minKREX: 0,
    multiplier: 1,
    feePercent: 1.0,
    pointsMultiplier: 1,
    label: 'Tier 0',
    description: '< 10M KREX',
  },
  Tier1: {
    tier: 'Tier1',
    minKREX: 10_000_000,
    multiplier: 2,
    feePercent: 0.8,
    pointsMultiplier: 2,
    label: 'Tier 1',
    description: '≥ 10M KREX',
  },
  Tier2: {
    tier: 'Tier2',
    minKREX: 50_000_000,
    multiplier: 5,
    feePercent: 0.7,
    pointsMultiplier: 5,
    label: 'Tier 2',
    description: '≥ 50M KREX',
  },
  Tier3: {
    tier: 'Tier3',
    minKREX: 100_000_000,
    multiplier: 10,
    feePercent: 0.5,
    pointsMultiplier: 10,
    label: 'Tier 3',
    description: '≥ 100M KREX',
  },
};

// Base reward rates per 1 KAS
export const BASE_REWARDS = {
  GRT_PER_KAS: 10000,
  LRT_PER_KAS: 1000,
  XP_PER_KAS: 100,
} as const;

// NFT multipliers and fee reductions
export const NFT_MULTIPLIER = 1; // +1x multiplier if holding at least 1 NFT from KREXPRIME or PIXELKREX collections
export const NFT_FEE_REDUCTION = 0.1; // 0.1% fee reduction
export const DIAMOND_NFT_MULTIPLIER = 3; // +3x multiplier for any Diamond NFT from any collection
export const DIAMOND_NFT_FEE_REDUCTION = 0.2; // 0.2% fee reduction for Diamond NFTs
export const RAREST_NFT_MULTIPLIER = 5; // +5x multiplier for rarest NFT (#515 PIXELKREX or #345 KREXPRIME)
export const RAREST_NFT_FEE_REDUCTION = 100; // 100% fee reduction = zero-fee mode

// Node provider defaults
export const DEFAULT_NODE_MULTIPLIER = 5; // 5x multiplier for node providers
export const DEFAULT_NODE_FEE_REDUCTION = 0.1; // 0.1% fee reduction for node providers

// Default fee distribution percentages
export const DEFAULT_FEE_DISTRIBUTION = {
  KASPAREX: 60,
  GRT_TREASURY: 20,
  LRT_TREASURY: 20,
} as const;

// Default base fee percentage
export const DEFAULT_BASE_FEE_PERCENT = 1.0;

