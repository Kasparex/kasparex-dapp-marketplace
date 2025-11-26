/**
 * Mock data utilities for rewards system simulation
 * These are default values used across all dApps until real data is integrated
 */

export const MOCK_REWARDS_CONFIG = {
  // Default fee percentage
  DEFAULT_FEE_PERCENT: 1.0,
  
  // Default reward rates per 1 KAS
  GRT_PER_KAS: 10000,
  LRT_PER_KAS: 1000,
  XP_PER_KAS: 100,
  
  // Default supply metrics
  GRT_MAX_SUPPLY: 100_000_000_000, // 100B
  LRT_MAX_SUPPLY: 100_000_000, // 100M per dApp
  
  // Default minted percentages (for simulation)
  GRT_MINTED_PERCENT: 2.5, // 2.5% of max supply minted globally
  LRT_MINTED_PERCENT: 1.5, // 1.5% of max supply minted per dApp
  
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
 * Get mock LRT supply metrics for a specific dApp
 */
export function getMockLRTSupplyMetrics() {
  const lrtMinted = (MOCK_REWARDS_CONFIG.LRT_MAX_SUPPLY * MOCK_REWARDS_CONFIG.LRT_MINTED_PERCENT) / 100;
  const lrtProgress = MOCK_REWARDS_CONFIG.LRT_MINTED_PERCENT;
  const dailyLRTEmission = MOCK_REWARDS_CONFIG.DAILY_KAS_SPENT * MOCK_REWARDS_CONFIG.LRT_PER_KAS;
  const remainingLRT = MOCK_REWARDS_CONFIG.LRT_MAX_SUPPLY - lrtMinted;
  const daysUntilExhaustion = dailyLRTEmission > 0 ? remainingLRT / dailyLRTEmission : Infinity;
  
  return {
    maxSupply: MOCK_REWARDS_CONFIG.LRT_MAX_SUPPLY,
    minted: lrtMinted,
    progress: lrtProgress,
    dailyEmission: dailyLRTEmission,
    daysUntilExhaustion,
  };
}

/**
 * Get mock wallet holdings
 */
export function getMockWalletHoldings(address: string | undefined) {
  if (!address) {
    return null;
  }
  
  // Generate consistent mock balances based on address
  // This ensures the same wallet always shows the same balances
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    grt: 1_500_000 + (hash % 500_000), // 1.5M - 2M GRT
    xp: 50_000 + (hash % 20_000), // 50K - 70K XP
    lrtBalances: [
      { ticker: 'QUIZ', balance: 10_000 + (hash % 5_000) },
      { ticker: 'PAY', balance: 5_000 + (hash % 3_000) },
      { ticker: 'GAME', balance: 8_000 + (hash % 4_000) },
    ],
  };
}

/**
 * Get default rewards breakdown for display
 */
export function getDefaultRewardsBreakdown(tokenTicker?: string) {
  return {
    feePercent: MOCK_REWARDS_CONFIG.DEFAULT_FEE_PERCENT,
    grtPerKas: MOCK_REWARDS_CONFIG.GRT_PER_KAS,
    lrtPerKas: MOCK_REWARDS_CONFIG.LRT_PER_KAS,
    xpPerKas: MOCK_REWARDS_CONFIG.XP_PER_KAS,
    tokenTicker: tokenTicker || 'LRT',
  };
}

