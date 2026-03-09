/**
 * Types for the Reward Calculator
 */

export type KREXTier = 'Tier0' | 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';

export interface KREXTierConfig {
  tier: KREXTier;
  minKREX: number;
  multiplier: number;
  feeReduction: number; // Fee reduction from base fee (in percentage points, e.g., 0.1 = -0.1%)
  /** @deprecated No cost reduction; kept for backward compatibility, always 0 */
  costReduction: number;
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
  /**
   * Partner collections ownership status
   * Key: Collection ID, Value: boolean (has NFT from this collection)
   */
  partnerCollections?: Record<string, boolean>;
  /**
   * Partner collections with Diamond NFTs
   * Key: Collection ID, Value: boolean (has Diamond NFT from this collection)
   */
  partnerDiamonds?: Record<string, boolean>;
}

export interface CustomBaseRewards {
  grtPerKas: number;
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
}

export interface SupplyMetrics {
  grtMaxSupply: number; // Default 100B
  dailyKasSpent: number; // Default 1000 KAS
  numberOfUsers: number; // Number of active users
  grtMinted: number; // Already minted GRT (for progress bar)
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
  baseXP: number;

  // Final rewards (after multipliers)
  finalGRT: number;
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
  };

  // Points
  pointsMultiplier: number;

  // Supply exhaustion calculations (GRT only)
  supplyMetrics?: {
    daysUntilGRTExhaustion: number;
    grtProgress: number; // Percentage minted
    dailyGRTEmission: number;
  };
}

export const KREX_TIERS: Record<KREXTier, KREXTierConfig> = {
  Tier0: {
    tier: 'Tier0',
    minKREX: 0,
    multiplier: 0,
    feeReduction: 0,
    costReduction: 0,
    pointsMultiplier: 0,
    label: 'Tier 0',
    description: '0 KREX',
  },
  Tier1: {
    tier: 'Tier1',
    minKREX: 1,
    multiplier: 1,
    feeReduction: 0.1,
    costReduction: 0,
    pointsMultiplier: 1,
    label: 'Tier 1',
    description: '≥ 1 KREX',
  },
  Tier2: {
    tier: 'Tier2',
    minKREX: 10_000_000,
    multiplier: 2,
    feeReduction: 0.2,
    costReduction: 0,
    pointsMultiplier: 2,
    label: 'Tier 2',
    description: '≥ 10M KREX',
  },
  Tier3: {
    tier: 'Tier3',
    minKREX: 50_000_000,
    multiplier: 5,
    feeReduction: 0.3,
    costReduction: 0,
    pointsMultiplier: 5,
    label: 'Tier 3',
    description: '≥ 50M KREX',
  },
  Tier4: {
    tier: 'Tier4',
    minKREX: 100_000_000,
    multiplier: 10,
    feeReduction: 0.5,
    costReduction: 0,
    pointsMultiplier: 10,
    label: 'Tier 4',
    description: '≥ 100M KREX',
  },
};

// Base reward rates per 1 KAS (GRT-only)
export const BASE_REWARDS = {
  GRT_PER_KAS: 10000,
  XP_PER_KAS: 100,
} as const;

// NFT multipliers and fee reductions (no cost reductions)
export const NFT_MULTIPLIER = 1;
export const NFT_FEE_REDUCTION = 0.1;
export const DIAMOND_NFT_MULTIPLIER = 3;
export const DIAMOND_NFT_FEE_REDUCTION = 0.2;
export const RAREST_NFT_MULTIPLIER = 5;
export const RAREST_NFT_FEE_REDUCTION = 100; // zero-fee mode

// Node provider defaults (no cost reductions; constants kept for backward compat)
export const DEFAULT_NODE_MULTIPLIER = 5;
export const DEFAULT_NODE_FEE_REDUCTION = 0.1;
/** @deprecated No cost reduction; always 0 */
export const NFT_COST_REDUCTION = 0;
/** @deprecated No cost reduction; always 0 */
export const DIAMOND_NFT_COST_REDUCTION = 0;
/** @deprecated No cost reduction; always 0 */
export const RAREST_NFT_COST_REDUCTION = 0;
/** @deprecated No cost reduction; always 0 */
export const LIGHT_NODE_COST_REDUCTION = 0;
/** @deprecated No cost reduction; always 0 */
export const MIRROR_NODE_COST_REDUCTION = 0;

// Default fee distribution percentages (GRT-only, no LRT treasury)
export const DEFAULT_FEE_DISTRIBUTION = {
  KASPAREX: 60,
  GRT_TREASURY: 40,
} as const;

// Default base fee percentage
export const DEFAULT_BASE_FEE_PERCENT = 1.0;

