/**
 * Types for the Reward Calculator (GRID ecosystem rewards + KAS fees + modeled pts).
 */

export type KREXTier = 'Tier0' | 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';

export interface KREXTierConfig {
  tier: KREXTier;
  minKREX: number;
  /** GRID reward multiplier (informational / calculator). */
  multiplier: number;
  /** Percent off fees (vBlog, vault, directory, etc.). */
  feeDiscountPercent: number;
  /** @deprecated Use feeDiscountPercent; kept for legacy UI that reads feeReduction. */
  feeReduction: number;
  /** @deprecated No cost reduction; kept for backward compatibility, always 0 */
  costReduction: number;
  /** Hub Points multiplier (0 = no hub points earned). */
  pointsMultiplier: number;
  label: string;
  description: string;
}

export interface NFTStatus {
  hasKREXPRIME: boolean;
  hasPIXELKREX: boolean;
  hasDiamondKREXPRIME: boolean;
  hasDiamondPIXELKREX: boolean;
  hasRarestNFT: boolean;
  partnerCollections?: Record<string, boolean>;
  partnerDiamonds?: Record<string, boolean>;
}

export interface CustomBaseRewards {
  gridPerKas: number;
  xpPerKas: number;
  useCustom: boolean;
}

export interface NodeProviderStatus {
  isNodeProvider: boolean;
  nodeMultiplier: number;
  nodeFeeReduction: number;
}

export interface FeeSettings {
  baseFeePercent: number;
  useCustomDistribution: boolean;
  kasparexPercent: number;
  gridTreasuryPercent: number;
}

export interface SupplyMetrics {
  gridMaxSupply: number;
  dailyKasSpent: number;
  numberOfUsers: number;
  gridMinted: number;
}

export interface CalculatorInputs {
  kasAmount: number;
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  seasonalBoost: number;
  customBaseRewards: CustomBaseRewards;
  nodeProvider: NodeProviderStatus;
  feeSettings: FeeSettings;
}

export interface RewardResult {
  baseGrid: number;
  baseXP: number;
  finalGrid: number;
  finalXP: number;
  krexMultiplier: number;
  nftMultiplier: number;
  nodeMultiplier: number;
  seasonalMultiplier: number;
  totalMultiplier: number;
  feePercent: number;
  feeAmount: number;
  feeDistribution: {
    kasparex: number;
    gridTreasury: number;
  };
  pointsMultiplier: number;
  supplyMetrics?: {
    daysUntilGridExhaustion: number;
    gridMintProgress: number;
    dailyGridEmission: number;
  };
}

export const KREX_TIERS: Record<KREXTier, KREXTierConfig> = {
  Tier0: {
    tier: 'Tier0',
    minKREX: 0,
    multiplier: 0,
    feeDiscountPercent: 0,
    feeReduction: 0,
    costReduction: 0,
    pointsMultiplier: 0,
    label: 'Tier 0',
    description: '< 1M KREX',
  },
  Tier1: {
    tier: 'Tier1',
    minKREX: 1_000_000,
    multiplier: 1,
    feeDiscountPercent: 2,
    feeReduction: 2,
    costReduction: 0,
    pointsMultiplier: 1,
    label: 'Tier 1',
    description: '≥ 1M KREX',
  },
  Tier2: {
    tier: 'Tier2',
    minKREX: 10_000_000,
    multiplier: 2,
    feeDiscountPercent: 5,
    feeReduction: 5,
    costReduction: 0,
    pointsMultiplier: 2,
    label: 'Tier 2',
    description: '≥ 10M KREX',
  },
  Tier3: {
    tier: 'Tier3',
    minKREX: 50_000_000,
    multiplier: 3,
    feeDiscountPercent: 50,
    feeReduction: 50,
    costReduction: 0,
    pointsMultiplier: 3,
    label: 'Tier 3',
    description: '≥ 50M KREX',
  },
  Tier4: {
    tier: 'Tier4',
    minKREX: 100_000_000,
    multiplier: 4,
    feeDiscountPercent: 80,
    feeReduction: 80,
    costReduction: 0,
    pointsMultiplier: 4,
    label: 'Tier 4',
    description: '≥ 100M KREX',
  },
};

export const BASE_REWARDS = {
  GRID_PER_KAS: 10000,
  XP_PER_KAS: 100,
} as const;

export const NFT_MULTIPLIER = 1;
export const NFT_FEE_REDUCTION = 0.1;
export const DIAMOND_NFT_MULTIPLIER = 3;
export const DIAMOND_NFT_FEE_REDUCTION = 0.2;
export const RAREST_NFT_MULTIPLIER = 5;
export const RAREST_NFT_FEE_REDUCTION = 100;

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

export const DEFAULT_FEE_DISTRIBUTION = {
  KASPAREX: 60,
  GRID_TREASURY: 40,
} as const;

export const DEFAULT_BASE_FEE_PERCENT = 1.0;
