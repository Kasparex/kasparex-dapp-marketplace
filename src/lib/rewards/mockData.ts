/**
 * Mock data utilities for rewards system simulation
 * These are default values used across all dApps until real data is integrated
 */

export const MOCK_REWARDS_CONFIG = {
  // Default fee percentage
  DEFAULT_FEE_PERCENT: 1.0,
  
  // Default reward rates per 1 KAS (GRT-only)
  GRT_PER_KAS: 10000,
  XP_PER_KAS: 100,
  
  // Default supply metrics (GRT only)
  GRT_MAX_SUPPLY: 100_000_000_000, // 100B
  
  // Default minted percentage (for simulation)
  GRT_MINTED_PERCENT: 2.5, // 2.5% of max supply minted globally
  
  // Default daily metrics
  DAILY_KAS_SPENT: 1000,
  NUMBER_OF_USERS: 100,
} as const;

/**
 * Get mock GRT supply metrics
 */
export function getMockGRTSupplyMetrics() {
  const grtMinted = (MOCK_REWARDS_CONFIG.GRT_MAX_SUPPLY * MOCK_REWARDS_CONFIG.GRT_MINTED_PERCENT) / 100;
  const grtProgress = MOCK_REWARDS_CONFIG.GRT_MINTED_PERCENT;
  const dailyGRTEmission = MOCK_REWARDS_CONFIG.DAILY_KAS_SPENT * MOCK_REWARDS_CONFIG.GRT_PER_KAS;
  const remainingGRT = MOCK_REWARDS_CONFIG.GRT_MAX_SUPPLY - grtMinted;
  const daysUntilExhaustion = dailyGRTEmission > 0 ? remainingGRT / dailyGRTEmission : Infinity;
  
  return {
    maxSupply: MOCK_REWARDS_CONFIG.GRT_MAX_SUPPLY,
    minted: grtMinted,
    progress: grtProgress,
    dailyEmission: dailyGRTEmission,
    daysUntilExhaustion,
  };
}

/**
 * Get mock wallet holdings (GRT and XP only)
 */
export function getMockWalletHoldings(address: string | undefined) {
  if (!address) {
    return null;
  }
  
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    grt: 1_500_000 + (hash % 500_000), // 1.5M - 2M GRT
    xp: 50_000 + (hash % 20_000), // 50K - 70K XP
  };
}

/**
 * Get default rewards breakdown for display (GRT-only)
 */
export function getDefaultRewardsBreakdown() {
  return {
    feePercent: MOCK_REWARDS_CONFIG.DEFAULT_FEE_PERCENT,
    grtPerKas: MOCK_REWARDS_CONFIG.GRT_PER_KAS,
    xpPerKas: MOCK_REWARDS_CONFIG.XP_PER_KAS,
  };
}

