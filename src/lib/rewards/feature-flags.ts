/**
 * Unified rewards feature flags (env-backed for Vercel).
 */
export function isRewardsL2RedemptionEnabled(): boolean {
  try {
    return process.env.NEXT_PUBLIC_ENABLE_REWARDS_L2_REDEMPTION === '1' ||
      process.env.NEXT_PUBLIC_ENABLE_REWARDS_L2_REDEMPTION === 'true';
  } catch {
    return false;
  }
}
