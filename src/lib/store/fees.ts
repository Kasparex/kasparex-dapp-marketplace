/**
 * Fee Calculation with Rewards Integration
 * Calculates platform fees with KREX/NFT holder discounts
 */

import { calculateRewards } from '@/lib/rewards/calculator';
import type { CalculatorInputs, KREXTier, NFTStatus } from '@/lib/rewards/types';
import type { FeeCalculation } from './types';

const BASE_PLATFORM_FEE_PERCENT = 5; // 5% base fee

/**
 * Calculate platform fee with rewards discounts
 * Takes KREX tier and NFT status as parameters (from hooks in components)
 */
export function calculatePlatformFee(
  priceKAS: number,
  krexTier: KREXTier | 'none' = 'none',
  nftStatus: NFTStatus | null = null
): FeeCalculation {
  // Use rewards calculator to get fee percentage with discounts
  const calculatorInputs: CalculatorInputs = {
    kasAmount: priceKAS,
    krexTier: krexTier === 'none' ? 'Tier0' : krexTier, // Default to Tier0 (Inactive) if none
    nftStatus: nftStatus || {
      hasKREXPRIME: false,
      hasPIXELKREX: false,
      hasDiamondKREXPRIME: false,
      hasDiamondPIXELKREX: false,
      hasRarestNFT: false,
    },
    seasonalBoost: 0,
    customBaseRewards: {
      useCustom: false,
      grtPerKas: 0,
      xpPerKas: 0,
    },
    feeSettings: {
      baseFeePercent: BASE_PLATFORM_FEE_PERCENT,
      useCustomDistribution: false,
      kasparexPercent: 0,
      grtTreasuryPercent: 0,
    },
    nodeProvider: {
      isNodeProvider: false,
      nodeMultiplier: 1,
      nodeFeeReduction: 0,
    },
  };

  const rewardResult = calculateRewards(calculatorInputs);

  // Calculate fee amounts
  const feePercent = rewardResult.feePercent;
  const feeAmount = (priceKAS * feePercent) / 100;
  const sellerRevenue = priceKAS - feeAmount;
  const totalAmount = priceKAS; // Buyer pays product price, fee is deducted from seller

  return {
    feePercent,
    feeAmount,
    sellerRevenue,
    totalAmount,
  };
}

/**
 * Calculate platform fee synchronously (for display purposes)
 * Uses default values if user status not available
 */
export function calculatePlatformFeeSync(
  priceKAS: number,
  feePercent: number = BASE_PLATFORM_FEE_PERCENT
): FeeCalculation {
  const feeAmount = (priceKAS * feePercent) / 100;
  const sellerRevenue = priceKAS - feeAmount;
  const totalAmount = priceKAS;

  return {
    feePercent,
    feeAmount,
    sellerRevenue,
    totalAmount,
  };
}
