/**
 * Mock data utilities for rewards system simulation
 * Supply and XP use real contract data; these config values are for fee/reward rates only.
 */

export const MOCK_REWARDS_CONFIG = {
  // Default fee percentage
  DEFAULT_FEE_PERCENT: 1.0,
  
  // Default reward rates per 1 KAS (GRT-only)
  GRT_PER_KAS: 10000,
  XP_PER_KAS: 100,
  
  // Default daily metrics (for calculators/estimates only)
  DAILY_KAS_SPENT: 1000,
  NUMBER_OF_USERS: 100,
} as const;

/**
 * Get default rewards breakdown for display (GRT-only).
 * Optional chainId: on IGRA Galleon (38836/38837) use deployed base reward (500 tGRID per payment).
 */
export function getDefaultRewardsBreakdown(chainId?: number) {
  const isGalleon = chainId === 38836 || chainId === 38837;
  return {
    feePercent: MOCK_REWARDS_CONFIG.DEFAULT_FEE_PERCENT,
    grtPerKas: isGalleon ? 500 : MOCK_REWARDS_CONFIG.GRT_PER_KAS,
    xpPerKas: MOCK_REWARDS_CONFIG.XP_PER_KAS,
  };
}

