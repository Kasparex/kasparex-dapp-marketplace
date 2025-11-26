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
  FEE_DISTRIBUTION,
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
  
  // NFT multiplier: +1x per regular NFT, +5x per Diamond NFT
  let nftMultiplier = 1;
  if (nftStatus.hasKREXPRIME) nftMultiplier += NFT_MULTIPLIER;
  if (nftStatus.hasPIXELKREX) nftMultiplier += NFT_MULTIPLIER;
  if (nftStatus.hasDiamondKREXPRIME) nftMultiplier += DIAMOND_NFT_MULTIPLIER;
  if (nftStatus.hasDiamondPIXELKREX) nftMultiplier += DIAMOND_NFT_MULTIPLIER;
  
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
  let feePercent = tierConfig.feePercent;
  
  // Apply NFT fee reductions (stack with tier reduction)
  if (nftStatus.hasKREXPRIME) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  if (nftStatus.hasPIXELKREX) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  
  // Apply Diamond NFT fee reductions (additional reduction)
  if (nftStatus.hasDiamondKREXPRIME) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  }
  if (nftStatus.hasDiamondPIXELKREX) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  }
  
  // Apply node provider fee reduction
  if (nodeProvider.isNodeProvider) {
    feePercent = Math.max(0, feePercent - nodeProvider.nodeFeeReduction);
  }

  const feeAmount = (kasAmount * feePercent) / 100;

  // Calculate fee distribution
  const feeDistribution = {
    kasparex: (feeAmount * FEE_DISTRIBUTION.KASPAREX) / 100,
    grtTreasury: (feeAmount * FEE_DISTRIBUTION.GRT_TREASURY) / 100,
    lrtTreasury: (feeAmount * FEE_DISTRIBUTION.LRT_TREASURY) / 100,
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

