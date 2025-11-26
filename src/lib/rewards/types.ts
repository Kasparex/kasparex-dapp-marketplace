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
}

export interface CalculatorInputs {
  kasAmount: number;
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  seasonalBoost: number; // percentage (0-100)
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
  
  // Multipliers
  krexMultiplier: number;
  totalMultiplier: number; // KREX + seasonal boost
  
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

// NFT fee reduction
export const NFT_FEE_REDUCTION = 0.2; // 0.2% reduction per NFT

// Fee distribution percentages
export const FEE_DISTRIBUTION = {
  KASPAREX: 60,
  GRT_TREASURY: 20,
  LRT_TREASURY: 20,
} as const;

