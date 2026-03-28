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
 * Optional chainId: on Igra Mainnet (38833) use deployed base reward (500 GRID per iKAS payment).
 */
export function getDefaultRewardsBreakdown(chainId?: number) {
  const isIgraMainnet = chainId === 38833;
  return {
    feePercent: MOCK_REWARDS_CONFIG.DEFAULT_FEE_PERCENT,
    grtPerKas: isIgraMainnet ? 500 : MOCK_REWARDS_CONFIG.GRT_PER_KAS,
    xpPerKas: MOCK_REWARDS_CONFIG.XP_PER_KAS,
  };
}

