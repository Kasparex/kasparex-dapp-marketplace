/**
 * Reward Calculator Logic
 * Calculates GRT (GRID), XP Points, fees, and distributions based on user inputs (GRT-only)
 */

import type {
  CalculatorInputs,
  RewardResult,
  KREXTier,
  NFTStatus,
} from './types';
import {
  KREX_TIERS,
  BASE_REWARDS,
  NFT_MULTIPLIER,
  NFT_FEE_REDUCTION,
  DIAMOND_NFT_MULTIPLIER,
  DIAMOND_NFT_FEE_REDUCTION,
  RAREST_NFT_MULTIPLIER,
  RAREST_NFT_FEE_REDUCTION,
  DEFAULT_FEE_DISTRIBUTION,
  DEFAULT_BASE_FEE_PERCENT,
} from './types';
import type { SupplyMetrics } from './types';

/**
 * Calculate supply exhaustion metrics (GRT only)
 */
export function calculateSupplyExhaustion(
  inputs: CalculatorInputs,
  supplyMetrics: SupplyMetrics,
  avgMultiplier: number
): {
  daysUntilGRTExhaustion: number;
  grtProgress: number;
  dailyGRTEmission: number;
} {
  const { grtMaxSupply, dailyKasSpent, grtMinted } = supplyMetrics;
  
  const grtPerKas = inputs.customBaseRewards.useCustom 
    ? inputs.customBaseRewards.grtPerKas 
    : BASE_REWARDS.GRT_PER_KAS;

  const dailyGRTEmission = dailyKasSpent * grtPerKas * avgMultiplier;
  const remainingGRT = Math.max(0, grtMaxSupply - grtMinted);
  const daysUntilGRTExhaustion = dailyGRTEmission > 0 
    ? remainingGRT / dailyGRTEmission 
    : Infinity;
  const grtProgress = grtMaxSupply > 0 ? (grtMinted / grtMaxSupply) * 100 : 0;

  return {
    daysUntilGRTExhaustion,
    grtProgress: Math.min(100, grtProgress),
    dailyGRTEmission,
  };
}

/**
 * Calculate rewards based on inputs
 */
export function calculateRewards(
  inputs: CalculatorInputs,
  supplyMetrics?: SupplyMetrics
): RewardResult {
  const { kasAmount, krexTier, nftStatus, seasonalBoost, customBaseRewards, nodeProvider } = inputs;

  // Get KREX tier configuration
  const tierConfig = KREX_TIERS[krexTier];

  // Determine base reward rates (use custom if enabled, otherwise default)
  const grtPerKas = customBaseRewards.useCustom ? customBaseRewards.grtPerKas : BASE_REWARDS.GRT_PER_KAS;
  const xpPerKas = customBaseRewards.useCustom ? customBaseRewards.xpPerKas : BASE_REWARDS.XP_PER_KAS;

  // Calculate base rewards (GRT-only)
  const baseGRT = kasAmount * grtPerKas;
  const baseXP = kasAmount * xpPerKas;

  // Calculate multipliers
  const krexMultiplier = tierConfig.multiplier;
  
  // NFT multiplier: Rarest NFT > Diamond NFT > Regular NFT
  let nftMultiplier = 1;
  const hasRegularNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = nftStatus.hasRarestNFT; // NFT #515 PIXELKREX or #345 KREXPRIME
  
  if (hasRarestNFT) {
    nftMultiplier += RAREST_NFT_MULTIPLIER; // +5x for rarest NFT (highest priority)
  } else if (hasDiamondNFT) {
    nftMultiplier += DIAMOND_NFT_MULTIPLIER; // +3x for any Diamond NFT
  } else if (hasRegularNFT) {
    nftMultiplier += NFT_MULTIPLIER; // +1x for at least 1 regular NFT
  }
  
  // Node provider multiplier
  const nodeMultiplier = nodeProvider.isNodeProvider ? nodeProvider.nodeMultiplier : 1;
  
  // Seasonal multiplier
  const seasonalMultiplier = 1 + seasonalBoost / 100; // Convert percentage to multiplier
  
  // Total multiplier (all combined)
  const totalMultiplier = krexMultiplier * nftMultiplier * nodeMultiplier * seasonalMultiplier;

  // Apply multipliers to rewards
  const finalGRT = baseGRT * totalMultiplier;
  // Points use KREX multiplier + NFT multiplier (not node or seasonal)
  const pointsMultiplier = tierConfig.pointsMultiplier * nftMultiplier;
  const finalXP = baseXP * pointsMultiplier;

  // Calculate fee
  // Use custom base fee if provided, otherwise use default
  const baseFee = inputs.feeSettings.baseFeePercent;
  let feePercent = baseFee;
  
  // Apply tier-based fee reductions from the base fee (like NFT fee reductions)
  // All tiers now use fee reduction system
  feePercent = Math.max(0, feePercent - tierConfig.feeReduction);
  
  // Apply NFT fee reductions (stack with tier reduction)
  // Rarest NFT: 100% reduction = zero-fee mode (highest priority)
  // Diamond NFT: -0.2% if holding any Diamond NFT
  // Regular NFT: -0.1% if holding at least 1 NFT from KREXPRIME or PIXELKREX
  if (hasRarestNFT) {
    feePercent = 0; // Zero-fee mode for rarest NFT
  } else if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasRegularNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  
  // Apply node provider fee reduction (only if not in zero-fee mode)
  if (nodeProvider.isNodeProvider && feePercent > 0) {
    feePercent = Math.max(0, feePercent - nodeProvider.nodeFeeReduction);
  }

  const feeAmount = (kasAmount * feePercent) / 100;

  // Calculate fee distribution (use custom if enabled, otherwise default) — GRT-only
  const kasparexPercent = inputs.feeSettings.useCustomDistribution
    ? inputs.feeSettings.kasparexPercent
    : DEFAULT_FEE_DISTRIBUTION.KASPAREX;
  const grtTreasuryPercent = inputs.feeSettings.useCustomDistribution
    ? inputs.feeSettings.grtTreasuryPercent
    : DEFAULT_FEE_DISTRIBUTION.GRT_TREASURY;

  const feeDistribution = {
    kasparex: (feeAmount * kasparexPercent) / 100,
    grtTreasury: (feeAmount * grtTreasuryPercent) / 100,
  };

  // Calculate supply exhaustion if metrics provided
  let supplyMetricsResult;
  if (supplyMetrics) {
    supplyMetricsResult = calculateSupplyExhaustion(inputs, supplyMetrics, totalMultiplier);
  }

  return {
    baseGRT,
    baseXP,
    finalGRT,
    finalXP,
    krexMultiplier,
    nftMultiplier,
    nodeMultiplier,
    seasonalMultiplier,
    totalMultiplier,
    feePercent,
    feeAmount,
    feeDistribution,
    pointsMultiplier,
    supplyMetrics: supplyMetricsResult,
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format large number with appropriate suffix (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Validate calculator inputs
 */
export function validateInputs(inputs: Partial<CalculatorInputs>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (inputs.kasAmount !== undefined) {
    if (inputs.kasAmount < 0) {
      errors.push('KAS amount must be positive');
    }
    if (inputs.kasAmount > 1_000_000) {
      errors.push('KAS amount seems unusually high');
    }
  }

  if (inputs.seasonalBoost !== undefined) {
    if (inputs.seasonalBoost < 0) {
      errors.push('Seasonal boost must be positive');
    }
    if (inputs.seasonalBoost > 1000) {
      errors.push('Seasonal boost seems unusually high');
    }
  }

  if (inputs.customBaseRewards?.useCustom) {
    if (inputs.customBaseRewards.grtPerKas < 0) {
      errors.push('GRT per KAS must be positive');
    }
    if (inputs.customBaseRewards.xpPerKas < 0) {
      errors.push('XP per KAS must be positive');
    }
  }

  if (inputs.nodeProvider?.isNodeProvider) {
    if (inputs.nodeProvider.nodeMultiplier < 1) {
      errors.push('Node multiplier must be at least 1x');
    }
    if (inputs.nodeProvider.nodeFeeReduction < 0) {
      errors.push('Node fee reduction must be positive');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

