/**
 * Combined KREX Balance Query
 * Fetches KREX balances from both L1 and L2, returns combined total
 */

import { queryL1KREXBalance } from './l1-balance';
import { queryL2KREXBalance } from './l2-balance';

export interface KREXBalanceResult {
  l1: number;
  l2: number;
  total: number;
}

/**
 * Query KREX balance from both L1 and L2 wallets
 * 
 * @param l1Address - Kaspa address (with or without kaspa: prefix), or null
 * @param l2Address - EVM address (0x...), or null
 * @returns Object with l1, l2, and total balances
 */
export async function queryKREXBalance(
  l1Address: string | null,
  l2Address: string | null
): Promise<KREXBalanceResult> {
  // If no addresses provided, return zeros
  if (!l1Address && !l2Address) {
    return { l1: 0, l2: 0, total: 0 };
  }

  // Query both in parallel for better performance
  const [l1Balance, l2Balance] = await Promise.all([
    l1Address ? queryL1KREXBalance(l1Address) : Promise.resolve(0),
    l2Address ? queryL2KREXBalance(l2Address) : Promise.resolve(0),
  ]);

  const total = l1Balance + l2Balance;

  console.log(`[KREX Balance] L1: ${l1Balance}, L2: ${l2Balance}, Total: ${total}`);

  return {
    l1: l1Balance,
    l2: l2Balance,
    total,
  };
}
