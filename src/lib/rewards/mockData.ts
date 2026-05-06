export const MOCK_REWARDS_CONFIG = {
  /** Default reward rates per 1 KAS (GRID) */
  GRID_PER_KAS: 10000,
  XP_PER_KAS: 100,
} as const;

export interface RewardsBreakdown {
  gridPerKas: number;
  xpPerKas: number;
}

/** Igra Galleon L2 chains use the reduced mock rate in UI helpers. */
const IGRA_L2_CHAIN_IDS = new Set([38836, 38833]);

/**
 * Get default rewards breakdown for display (GRID + L2 pts).
 * Pass `true` / `false` for legacy callers, or a wagmi **chainId** (e.g. 38836) for L2-aware defaults.
 */
export function getDefaultRewardsBreakdown(chainIdOrIsIgra?: number | boolean): RewardsBreakdown {
  const isIgraL2 =
    typeof chainIdOrIsIgra === 'boolean'
      ? chainIdOrIsIgra
      : typeof chainIdOrIsIgra === 'number' && IGRA_L2_CHAIN_IDS.has(chainIdOrIsIgra);
  return {
    gridPerKas: isIgraL2 ? 500 : MOCK_REWARDS_CONFIG.GRID_PER_KAS,
    xpPerKas: MOCK_REWARDS_CONFIG.XP_PER_KAS,
  };
}
