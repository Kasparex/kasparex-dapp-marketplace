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
}

export interface CustomBaseRewards {
  grtPerKas: number;
  lrtPerKas: number;
  xpPerKas: number;
  useCustom: boolean;
}

export interface NodeProviderStatus {
  isNodeProvider: boolean;
  nodeMultiplier: number; // e.g., 1.5x, 2x
  nodeFeeReduction: number; // percentage reduction
}

export interface CalculatorInputs {
  kasAmount: number;
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  seasonalBoost: number; // percentage (0-100)
  customBaseRewards: CustomBaseRewards;
  nodeProvider: NodeProviderStatus;
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
}

export const KREX_TIERS: Record<KREXTier, KREXTierConfig> = {
  Tier0: {
    tier: 'Tier0',
    minKREX: 0,
    multiplier: 1,
    feePercent: 1.0,
    pointsMultiplier: 1,
    label: 'Tier 0',
    description: '< 1M KREX',
  },
  Tier1: {
    tier: 'Tier1',
    minKREX: 1_000_000,
    multiplier: 2,
    feePercent: 0.8,
    pointsMultiplier: 2,
    label: 'Tier 1',
    description: '≥ 1M KREX',
  },
  Tier2: {
    tier: 'Tier2',
    minKREX: 10_000_000,
    multiplier: 6,
    feePercent: 0.5,
    pointsMultiplier: 6,
    label: 'Tier 2',
    description: '≥ 10M KREX',
  },
  Tier3: {
    tier: 'Tier3',
    minKREX: 100_000_000,
    multiplier: 11,
    feePercent: 0.3,
    pointsMultiplier: 11,
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
export const NFT_MULTIPLIER = 1; // +1x multiplier per NFT (e.g., 2x total if has one NFT)
export const NFT_FEE_REDUCTION = 0.2; // 0.2% reduction per NFT
export const DIAMOND_NFT_FEE_REDUCTION = 0.3; // 0.3% additional reduction for Diamond NFTs

// Node provider defaults
export const DEFAULT_NODE_MULTIPLIER = 1.5; // 1.5x multiplier for node providers
export const DEFAULT_NODE_FEE_REDUCTION = 0.1; // 0.1% fee reduction for node providers

// Fee distribution percentages
export const FEE_DISTRIBUTION = {
  KASPAREX: 60,
  GRT_TREASURY: 20,
  LRT_TREASURY: 20,
} as const;

