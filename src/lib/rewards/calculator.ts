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
  NFT_FEE_REDUCTION,
  FEE_DISTRIBUTION,
} from './types';

/**
 * Calculate rewards based on inputs
 */
export function calculateRewards(inputs: CalculatorInputs): RewardResult {
  const { kasAmount, krexTier, nftStatus, seasonalBoost } = inputs;

  // Get KREX tier configuration
  const tierConfig = KREX_TIERS[krexTier];

  // Calculate base rewards
  const baseGRT = kasAmount * BASE_REWARDS.GRT_PER_KAS;
  const baseLRT = kasAmount * BASE_REWARDS.LRT_PER_KAS;
  const baseXP = kasAmount * BASE_REWARDS.XP_PER_KAS;

  // Calculate multipliers
  const krexMultiplier = tierConfig.multiplier;
  const seasonalMultiplier = 1 + seasonalBoost / 100; // Convert percentage to multiplier
  const totalMultiplier = krexMultiplier * seasonalMultiplier;

  // Apply multipliers to rewards
  const finalGRT = baseGRT * totalMultiplier;
  const finalLRT = baseLRT * totalMultiplier;
  const finalXP = baseXP * tierConfig.pointsMultiplier; // Points use KREX multiplier only

  // Calculate fee
  let feePercent = tierConfig.feePercent;
  
  // Apply NFT fee reductions (stack with tier reduction)
  if (nftStatus.hasKREXPRIME) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  if (nftStatus.hasPIXELKREX) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }

  const feeAmount = (kasAmount * feePercent) / 100;

  // Calculate fee distribution
  const feeDistribution = {
    kasparex: (feeAmount * FEE_DISTRIBUTION.KASPAREX) / 100,
    grtTreasury: (feeAmount * FEE_DISTRIBUTION.GRT_TREASURY) / 100,
    lrtTreasury: (feeAmount * FEE_DISTRIBUTION.LRT_TREASURY) / 100,
  };

  return {
    baseGRT,
    baseLRT,
    baseXP,
    finalGRT,
    finalLRT,
    finalXP,
    krexMultiplier,
    totalMultiplier,
    feePercent,
    feeAmount,
    feeDistribution,
    pointsMultiplier: tierConfig.pointsMultiplier,
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

  return {
    valid: errors.length === 0,
    errors,
  };
}

