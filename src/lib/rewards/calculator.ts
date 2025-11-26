/**
 * Reward Calculator Logic
 * Calculates GRT, LRT, XP Points, fees, and distributions based on user inputs
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
  DEFAULT_FEE_DISTRIBUTION,
  DEFAULT_BASE_FEE_PERCENT,
} from './types';
import type { SupplyMetrics } from './types';

/**
 * Calculate supply exhaustion metrics
 */
export function calculateSupplyExhaustion(
  inputs: CalculatorInputs,
  supplyMetrics: SupplyMetrics,
  avgMultiplier: number
): {
  daysUntilGRTExhaustion: number;
  daysUntilLRTExhaustion: number;
  grtProgress: number;
  lrtProgress: number;
  dailyGRTEmission: number;
  dailyLRTEmission: number;
} {
  const { grtMaxSupply, lrtMaxSupply, dailyKasSpent, numberOfUsers, grtMinted, lrtMinted } = supplyMetrics;
  
  // Calculate base rewards per KAS
  const grtPerKas = inputs.customBaseRewards.useCustom 
    ? inputs.customBaseRewards.grtPerKas 
    : BASE_REWARDS.GRT_PER_KAS;
  const lrtPerKas = inputs.customBaseRewards.useCustom 
    ? inputs.customBaseRewards.lrtPerKas 
    : BASE_REWARDS.LRT_PER_KAS;

  // Calculate daily emissions (total across all users)
  const dailyGRTEmission = dailyKasSpent * grtPerKas * avgMultiplier;
  const dailyLRTEmission = dailyKasSpent * lrtPerKas * avgMultiplier;

  // Calculate remaining supply
  const remainingGRT = Math.max(0, grtMaxSupply - grtMinted);
  const remainingLRT = Math.max(0, lrtMaxSupply - lrtMinted);

  // Calculate days until exhaustion
  const daysUntilGRTExhaustion = dailyGRTEmission > 0 
    ? remainingGRT / dailyGRTEmission 
    : Infinity;
  const daysUntilLRTExhaustion = dailyLRTEmission > 0 
    ? remainingLRT / dailyLRTEmission 
    : Infinity;

  // Calculate progress percentages
  const grtProgress = grtMaxSupply > 0 ? (grtMinted / grtMaxSupply) * 100 : 0;
  const lrtProgress = lrtMaxSupply > 0 ? (lrtMinted / lrtMaxSupply) * 100 : 0;

  return {
    daysUntilGRTExhaustion,
    daysUntilLRTExhaustion,
    grtProgress: Math.min(100, grtProgress),
    lrtProgress: Math.min(100, lrtProgress),
    dailyGRTEmission,
    dailyLRTEmission,
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
  const lrtPerKas = customBaseRewards.useCustom ? customBaseRewards.lrtPerKas : BASE_REWARDS.LRT_PER_KAS;
  const xpPerKas = customBaseRewards.useCustom ? customBaseRewards.xpPerKas : BASE_REWARDS.XP_PER_KAS;

  // Calculate base rewards
  const baseGRT = kasAmount * grtPerKas;
  const baseLRT = kasAmount * lrtPerKas;
  const baseXP = kasAmount * xpPerKas;

  // Calculate multipliers
  const krexMultiplier = tierConfig.multiplier;
  
  // NFT multiplier: +1x if holding at least 1 NFT from KREXPRIME or PIXELKREX, +3x if holding any Diamond NFT
  let nftMultiplier = 1;
  const hasRegularNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  
  if (hasDiamondNFT) {
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
  const finalLRT = baseLRT * totalMultiplier;
  // Points use KREX multiplier + NFT multiplier (not node or seasonal)
  const pointsMultiplier = tierConfig.pointsMultiplier * nftMultiplier;
  const finalXP = baseXP * pointsMultiplier;

  // Calculate fee
  // Use custom base fee if provided, otherwise use tier's default fee
  const baseFee = inputs.feeSettings.baseFeePercent;
  let feePercent = baseFee;
  
  // Apply tier-based fee reductions from the base fee
  // Tier0: base fee (no reduction)
  // Tier1: 0.8% of base (20% reduction)
  // Tier2: 0.7% of base (30% reduction)
  // Tier3: 0.5% of base (50% reduction)
  if (krexTier === 'Tier1') {
    feePercent = baseFee * 0.8;
  } else if (krexTier === 'Tier2') {
    feePercent = baseFee * 0.7;
  } else if (krexTier === 'Tier3') {
    feePercent = baseFee * 0.5;
  }
  
  // Apply NFT fee reductions (stack with tier reduction)
  // Regular NFT: -0.1% if holding at least 1 NFT from KREXPRIME or PIXELKREX
  // Diamond NFT: -0.2% if holding any Diamond NFT (replaces regular NFT reduction)
  if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasRegularNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  
  // Apply node provider fee reduction
  if (nodeProvider.isNodeProvider) {
    feePercent = Math.max(0, feePercent - nodeProvider.nodeFeeReduction);
  }

  const feeAmount = (kasAmount * feePercent) / 100;

  // Calculate fee distribution (use custom if enabled, otherwise default)
  const distribution = inputs.feeSettings.useCustomDistribution
    ? {
        kasparex: inputs.feeSettings.kasparexPercent,
        grtTreasury: inputs.feeSettings.grtTreasuryPercent,
        lrtTreasury: inputs.feeSettings.lrtTreasuryPercent,
      }
    : DEFAULT_FEE_DISTRIBUTION;

  const feeDistribution = {
    kasparex: (feeAmount * distribution.kasparex) / 100,
    grtTreasury: (feeAmount * distribution.grtTreasury) / 100,
    lrtTreasury: (feeAmount * distribution.lrtTreasury) / 100,
  };

  // Calculate supply exhaustion if metrics provided
  let supplyMetricsResult;
  if (supplyMetrics) {
    supplyMetricsResult = calculateSupplyExhaustion(inputs, supplyMetrics, totalMultiplier);
  }

  return {
    baseGRT,
    baseLRT,
    baseXP,
    finalGRT,
    finalLRT,
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
    if (inputs.customBaseRewards.lrtPerKas < 0) {
      errors.push('LRT per KAS must be positive');
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

