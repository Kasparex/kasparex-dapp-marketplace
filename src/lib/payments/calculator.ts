/**
 * Automatic Cost Calculator
 * 
 * Calculates final transaction costs with KREX/NFT/node discounts applied
 */

import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { getDAppPaymentConfig, getActionCost } from './config';
import { KREX_TIERS, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION, type KREXTier } from '@/lib/rewards/types';

export interface CostBreakdown {
  baseCost: number;
  feePercent: number;
  feeAmount: number;
  costReductionPercent: number;
  costReductionAmount: number;
  finalCost: number;
  finalCostWithFee: number;
  breakdown: {
    baseCost: number;
    feeReduction: number;
    costReduction: number;
    subtotal: number;
    fee: number;
    total: number;
  };
}

export interface CostCalculatorInputs {
  dapp: DApp;
  actionId: string;
  krexBalance: number;
  krexTier: KREXTier;
  hasAnyNFT: boolean;
  hasDiamondNFT: boolean;
  hasRarestNFT: boolean;
  isNodeProvider?: boolean;
  nodeFeeReduction?: number;
  /** When set, use this as base cost instead of config (e.g. user-entered amount for Simple Payment). */
  overrideBaseCost?: number;
}

/**
 * Calculate final cost for a dApp action with all discounts applied
 */
export function calculateCost(inputs: CostCalculatorInputs): CostBreakdown {
  const {
    dapp,
    actionId,
    krexBalance,
    krexTier,
    hasAnyNFT,
    hasDiamondNFT,
    hasRarestNFT,
    isNodeProvider = false,
    nodeFeeReduction = 0,
    overrideBaseCost,
  } = inputs;

  // Determine network type
  const networkType = getDAppNetworkType(dapp);
  
  // Get base cost: use override (e.g. user-entered amount) or payment config
  const baseCost = overrideBaseCost != null && overrideBaseCost > 0
    ? overrideBaseCost
    : getActionCost(dapp, actionId, networkType);
  
  // Get KREX tier configuration
  const tierConfig = KREX_TIERS[krexTier];
  
  // Calculate fee percentage (base fee with reductions)
  const baseFee = 1.0; // Base fee is 1%
  let feePercent = baseFee;
  
  // Apply tier-based fee reduction (Tier0 has 0 reduction)
  if (krexBalance > 0) {
    feePercent = Math.max(0, feePercent - tierConfig.feeReduction);
  }
  
  // Apply NFT fee reductions (stack with tier reduction)
  if (hasRarestNFT) {
    feePercent = 0; // Zero fee mode
  } else if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasAnyNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  
  // Apply node provider fee reduction (only if not in zero-fee mode)
  if (isNodeProvider && feePercent > 0) {
    feePercent = Math.max(0, feePercent - nodeFeeReduction);
  }
  
  // No cost reduction: subtotal = base cost, fee applied to base
  const costReductionPercent = 0;
  const costReductionAmount = 0;
  const subtotal = baseCost;
  const feeAmount = (subtotal * feePercent) / 100;
  const finalCost = subtotal;
  const finalCostWithFee = subtotal + feeAmount;
  
  return {
    baseCost,
    feePercent,
    feeAmount,
    costReductionPercent,
    costReductionAmount,
    finalCost,
    finalCostWithFee,
    breakdown: {
      baseCost,
      feeReduction: baseFee - feePercent,
      costReduction: costReductionAmount,
      subtotal,
      fee: feeAmount,
      total: finalCostWithFee,
    },
  };
}

/**
 * Format cost breakdown for display
 */
export function formatCostBreakdown(breakdown: CostBreakdown): string {
  const parts: string[] = [];
  
  if (breakdown.costReductionPercent > 0) {
    parts.push(`${breakdown.baseCost.toFixed(2)} KAS`);
    parts.push(`-${breakdown.costReductionPercent.toFixed(1)}%`);
  } else {
    parts.push(`${breakdown.baseCost.toFixed(2)} KAS`);
  }
  
  if (breakdown.feePercent > 0) {
    parts.push(`+${breakdown.feePercent.toFixed(2)}% fee`);
  } else if (breakdown.feePercent === 0 && breakdown.costReductionPercent > 0) {
    parts.push('(zero fee)');
  }
  
  return parts.join(' ');
}
