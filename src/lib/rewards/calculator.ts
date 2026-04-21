/**
 * Reward Calculator Logic
 * Calculates GRID, XP Points, fees, and distributions based on user inputs.
 */

import type {
  CalculatorInputs,
  RewardResult,
  KREXTier,
  NFTStatus,
  SupplyMetrics,
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
} from './types';

/**
 * Calculate supply exhaustion metrics (GRID)
 */
export function calculateSupplyExhaustion(
  inputs: CalculatorInputs,
  supplyMetrics: SupplyMetrics,
  avgMultiplier: number
): {
  daysUntilGridExhaustion: number;
  gridMintProgress: number;
  dailyGridEmission: number;
} {
  const { gridMaxSupply, dailyKasSpent, gridMinted } = supplyMetrics;

  const gridPerKas = inputs.customBaseRewards.useCustom
    ? inputs.customBaseRewards.gridPerKas
    : BASE_REWARDS.GRID_PER_KAS;

  const dailyGridEmission = dailyKasSpent * gridPerKas * avgMultiplier;
  const remainingGrid = Math.max(0, gridMaxSupply - gridMinted);
  const daysUntilGridExhaustion =
    dailyGridEmission > 0 ? remainingGrid / dailyGridEmission : Infinity;
  const gridMintProgress = gridMaxSupply > 0 ? (gridMinted / gridMaxSupply) * 100 : 0;

  return {
    daysUntilGridExhaustion,
    gridMintProgress: Math.min(100, gridMintProgress),
    dailyGridEmission,
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

  const tierConfig = KREX_TIERS[krexTier];

  const gridPerKas = customBaseRewards.useCustom
    ? customBaseRewards.gridPerKas
    : BASE_REWARDS.GRID_PER_KAS;
  const xpPerKas = customBaseRewards.useCustom ? customBaseRewards.xpPerKas : BASE_REWARDS.XP_PER_KAS;

  const baseGrid = kasAmount * gridPerKas;
  const baseXP = kasAmount * xpPerKas;

  const krexMultiplier = tierConfig.multiplier;

  let nftMultiplier = 1;
  const hasRegularNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = nftStatus.hasRarestNFT;

  if (hasRarestNFT) {
    nftMultiplier += RAREST_NFT_MULTIPLIER;
  } else if (hasDiamondNFT) {
    nftMultiplier += DIAMOND_NFT_MULTIPLIER;
  } else if (hasRegularNFT) {
    nftMultiplier += NFT_MULTIPLIER;
  }

  const nodeMultiplier = nodeProvider.isNodeProvider ? nodeProvider.nodeMultiplier : 1;
  const seasonalMultiplier = 1 + seasonalBoost / 100;
  const totalMultiplier = krexMultiplier * nftMultiplier * nodeMultiplier * seasonalMultiplier;

  const finalGrid = baseGrid * totalMultiplier;
  const pointsMultiplier = tierConfig.pointsMultiplier * nftMultiplier;
  const finalXP = baseXP * pointsMultiplier;

  const baseFee = inputs.feeSettings.baseFeePercent;
  let feePercent = baseFee;

  feePercent = Math.max(0, feePercent - tierConfig.feeReduction);

  if (hasRarestNFT) {
    feePercent = 0;
  } else if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasRegularNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }

  if (nodeProvider.isNodeProvider && feePercent > 0) {
    feePercent = Math.max(0, feePercent - nodeProvider.nodeFeeReduction);
  }

  const feeAmount = (kasAmount * feePercent) / 100;

  const kasparexPercent = inputs.feeSettings.useCustomDistribution
    ? inputs.feeSettings.kasparexPercent
    : DEFAULT_FEE_DISTRIBUTION.KASPAREX;
  const gridTreasuryPercent = inputs.feeSettings.useCustomDistribution
    ? inputs.feeSettings.gridTreasuryPercent
    : DEFAULT_FEE_DISTRIBUTION.GRID_TREASURY;

  const feeDistribution = {
    kasparex: (feeAmount * kasparexPercent) / 100,
    gridTreasury: (feeAmount * gridTreasuryPercent) / 100,
  };

  let supplyMetricsResult;
  if (supplyMetrics) {
    supplyMetricsResult = calculateSupplyExhaustion(inputs, supplyMetrics, totalMultiplier);
  }

  return {
    baseGrid,
    baseXP,
    finalGrid,
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

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(num: number): string {
  if (Number.isInteger(num)) return String(num);
  const s = num.toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    const v = num / 1_000_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    const v = num / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(2)}M`;
  }
  if (num >= 1_000) {
    const v = num / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(2)}K`;
  }
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '') || '0';
}

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
    if (inputs.customBaseRewards.gridPerKas < 0) {
      errors.push('GRID per KAS must be positive');
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
