/**
 * Reward Calculation System
 * 
 * Calculates rewards (GRID and dApp tokens) based on action type, base action value, and user tier.
 * This is separate from cost calculation - rewards are calculated independently.
 */

import { DApp } from '@/lib/dapps';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { getDefaultRewardsBreakdown } from './mockData';

export interface RewardCalculationResult {
  gridReward: number;
  dAppTokenReward: number;
  xpReward: number;
  breakdown: {
    baseGridReward: number;
    baseDAppTokenReward: number;
    baseXPReward: number;
    krexMultiplier: number;
    finalGridReward: number;
    finalDAppTokenReward: number;
    finalXPReward: number;
  };
}

export interface RewardCalculatorInputs {
  dapp: DApp;
  actionId: string;
  baseActionValue: number; // Base action value in KAS (before discounts)
  krexTier: KREXTier;
  multiplier: number; // KREX tier multiplier
  tokenTicker?: string; // dApp token ticker
}

/**
 * Calculate reward amounts based on action type, base action value, and user tier
 * 
 * Rewards are calculated separately from transaction costs:
 * - Base rewards are calculated from the base action value (before discounts)
 * - KREX tier multiplier is applied to rewards
 * - Returns GRID, dApp token, and XP rewards
 */
export function calculateRewardAmount(
  inputs: RewardCalculatorInputs
): RewardCalculationResult {
  const {
    dapp,
    actionId,
    baseActionValue,
    krexTier,
    multiplier,
    tokenTicker,
  } = inputs;

  // Get default rewards breakdown (GRID per KAS, dApp token per KAS, XP per KAS)
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);
  
  // Calculate base rewards from action value
  const baseGridReward = baseActionValue * rewards.grtPerKas;
  const baseDAppTokenReward = baseActionValue * rewards.lrtPerKas;
  const baseXPReward = baseActionValue * rewards.xpPerKas;
  
  // Apply KREX tier multiplier to rewards
  const finalGridReward = baseGridReward * multiplier;
  const finalDAppTokenReward = baseDAppTokenReward * multiplier;
  const finalXPReward = baseXPReward * multiplier;
  
  return {
    gridReward: finalGridReward,
    dAppTokenReward: finalDAppTokenReward,
    xpReward: finalXPReward,
    breakdown: {
      baseGridReward,
      baseDAppTokenReward,
      baseXPReward,
      krexMultiplier: multiplier,
      finalGridReward,
      finalDAppTokenReward,
      finalXPReward,
    },
  };
}

/**
 * Format reward breakdown for display
 */
export function formatRewardBreakdown(result: RewardCalculationResult, tokenTicker?: string): string {
  const parts: string[] = [];
  
  if (result.gridReward > 0) {
    parts.push(`${result.gridReward.toFixed(2)} GRID`);
  }
  
  if (result.dAppTokenReward > 0 && tokenTicker) {
    parts.push(`${result.dAppTokenReward.toFixed(2)} ${tokenTicker}`);
  }
  
  if (result.xpReward > 0) {
    parts.push(`${result.xpReward.toFixed(0)} XP`);
  }
  
  if (result.breakdown.krexMultiplier > 1) {
    parts.push(`(${result.breakdown.krexMultiplier}x multiplier)`);
  }
  
  return parts.join(' + ');
}
