import type { KREXTier } from '@/lib/rewards/types';
import { queryL1KREXBalance } from './l1-balance';
import { getKREXTierFromBalance } from './tier';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';

/** Best-effort KREX tier from a Kaspa L1 wallet (L1 balance only on server). */
export async function getKrexTierForKaspaWallet(wallet: string): Promise<KREXTier> {
  try {
    const balance = await queryL1KREXBalance(wallet);
    return getKREXTierFromBalance(balance);
  } catch {
    return 'Tier0';
  }
}

export async function resolveHubEarnDeltaForKaspaWallet(
  basePoints: number,
  wallet: string,
): Promise<{ delta: number; tier: KREXTier }> {
  const tier = await getKrexTierForKaspaWallet(wallet);
  return { delta: computeEarnedHubPoints(basePoints, tier), tier };
}
