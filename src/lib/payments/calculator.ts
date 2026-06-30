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
  
  // Calculate fee percentage (base fee with reductions). vDonations L2: 10% to Revenue Tree; other dApps: 1%.
  const baseFee = (dapp.id === 'vdonations' || dapp.slug === 'vdonations') ? 10.0 : 1.0;
  let feePercent = baseFee;
  
  // Apply tier-based fee discount (1M+ KREX)
  if (krexBalance >= KREX_TIERS.Tier1.minKREX) {
    feePercent = Math.max(0, feePercent * (1 - tierConfig.feeDiscountPercent / 100));
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
 * Format a price for display (compact: "10" for whole numbers, "10.5" for decimals).
 * Does not include currency symbol; pass symbol separately when rendering.
 */
export function formatPrice(n: number): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  return fixed.replace(/\.?0+$/, '') || '0';
}

/** Format percent for display: integers as "10", decimals as "0.5" (no trailing zeros). */
export function formatPercent(p: number): string {
  if (Number.isInteger(p)) return String(p);
  const s = p.toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
}

/**
 * Format cost breakdown for display (fee-inclusive: total is the price).
 * @param symbol - Native currency symbol (e.g. KAS, iKAS). Must be passed by caller.
 */
export function formatCostBreakdown(breakdown: CostBreakdown, symbol: string): string {
  const parts: string[] = [];
  
  if (breakdown.costReductionPercent > 0) {
    parts.push(`${formatPrice(breakdown.baseCost)} ${symbol}`);
    parts.push(`-${formatPercent(breakdown.costReductionPercent)}%`);
  } else {
    parts.push(`${formatPrice(breakdown.baseCost)} ${symbol}`);
  }
  
  if (breakdown.feePercent > 0) {
    parts.push(`(includes ${formatPercent(breakdown.feePercent)}% fee)`);
  } else if (breakdown.feePercent === 0 && breakdown.costReductionPercent > 0) {
    parts.push('(zero fee)');
  }
  
  return parts.join(' ');
}
