/**
 * KREX Tier Calculation
 * Determines user tier based on KREX balance
 */

import type { KREXTier } from '@/lib/rewards/types';

/**
 * Calculate KREX tier from balance
 * 
 * @param balance - Total KREX balance (L1 + L2 combined)
 * @returns KREX tier
 */
export function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance < 1_000_000) return 'Tier0';
  if (balance >= 100_000_000) return 'Tier4';
  if (balance >= 50_000_000) return 'Tier3';
  if (balance >= 10_000_000) return 'Tier2';
  return 'Tier1';
}
