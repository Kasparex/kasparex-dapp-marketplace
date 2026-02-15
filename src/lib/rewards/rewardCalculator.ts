/**
 * Reward Calculation System
 * Calculates GRID (GRT) and XP rewards based on action type, base action value, and user tier.
 * This is separate from cost calculation - rewards are calculated independently. GRT-only.
 */

import { DApp } from '@/lib/dapps';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { getDefaultRewardsBreakdown } from './mockData';

export interface RewardCalculationResult {
  gridReward: number;
  xpReward: number;
  breakdown: {
    baseGridReward: number;
    baseXPReward: number;
    krexMultiplier: number;
    finalGridReward: number;
    finalXPReward: number;
  };
}

export interface RewardCalculatorInputs {
  dapp: DApp;
  actionId: string;
  baseActionValue: number; // Base action value in KAS (before discounts)
  krexTier: KREXTier;
  multiplier: number; // KREX tier multiplier
}

/**
 * Calculate reward amounts based on action type, base action value, and user tier (GRT-only).
 */
export function calculateRewardAmount(
  inputs: RewardCalculatorInputs
): RewardCalculationResult {
  const { baseActionValue, multiplier } = inputs;

  const rewards = getDefaultRewardsBreakdown();
  const baseGridReward = baseActionValue * rewards.grtPerKas;
  const baseXPReward = baseActionValue * rewards.xpPerKas;
  const finalGridReward = baseGridReward * multiplier;
  const finalXPReward = baseXPReward * multiplier;
  
  return {
    gridReward: finalGridReward,
    xpReward: finalXPReward,
    breakdown: {
      baseGridReward,
      baseXPReward,
      krexMultiplier: multiplier,
      finalGridReward,
      finalXPReward,
    },
  };
}

/**
 * Format reward breakdown for display (GRID + XP only)
 */
export function formatRewardBreakdown(result: RewardCalculationResult): string {
  const parts: string[] = [];
  if (result.gridReward > 0) parts.push(`${result.gridReward.toFixed(2)} GRID`);
  if (result.xpReward > 0) parts.push(`${result.xpReward.toFixed(0)} XP`);
  if (result.breakdown.krexMultiplier > 1) {
    parts.push(`(${result.breakdown.krexMultiplier}x multiplier)`);
  }
  return parts.join(' + ');
}
