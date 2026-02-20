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
  
  // Base cost = total price user pays (fee-inclusive). Fee is taken from this amount, not added on top.
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
  
  // Fee-inclusive: total = baseCost, fee is a portion of it, recipient gets the rest
  const costReductionPercent = 0;
  const costReductionAmount = 0;
  const totalPaid = baseCost;
  const feeAmount = (totalPaid * feePercent) / 100;
  const amountToRecipient = totalPaid - feeAmount;
  
  return {
    baseCost: totalPaid,
    feePercent,
    feeAmount,
    costReductionPercent,
    costReductionAmount,
    finalCost: totalPaid,
    finalCostWithFee: totalPaid, // Same as baseCost: total price (fee included)
    breakdown: {
      baseCost: totalPaid,
      feeReduction: baseFee - feePercent,
      costReduction: costReductionAmount,
      subtotal: amountToRecipient,
      fee: feeAmount,
      total: totalPaid,
    },
  };
}

/**
 * Format a price for display (clean numbers: 10, 10.5, 1.00, 3.02 — no 1.0001).
 */
export function formatPrice(n: number): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  return fixed.replace(/\.?0+$/, '') || '0';
}

/**
 * Format cost breakdown for display (fee-inclusive: total is the price).
 * @param symbol - Native currency symbol (e.g. KAS, iKAS). Default 'KAS'.
 */
export function formatCostBreakdown(breakdown: CostBreakdown, symbol: string = 'KAS'): string {
  const parts: string[] = [];
  
  if (breakdown.costReductionPercent > 0) {
    parts.push(`${formatPrice(breakdown.baseCost)} ${symbol}`);
    parts.push(`-${breakdown.costReductionPercent.toFixed(1)}%`);
  } else {
    parts.push(`${formatPrice(breakdown.baseCost)} ${symbol}`);
  }
  
  if (breakdown.feePercent > 0) {
    parts.push(`(includes ${breakdown.feePercent.toFixed(2)}% fee)`);
  } else if (breakdown.feePercent === 0 && breakdown.costReductionPercent > 0) {
    parts.push('(zero fee)');
  }
  
  return parts.join(' ');
}
