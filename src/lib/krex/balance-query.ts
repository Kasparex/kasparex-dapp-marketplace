/**
 * Combined KREX Balance Query
 * Fetches KREX balances from L1 KRC-20, L2 ERC-20, and optional L1 KCC20 wrap.
 */

import { queryL1KREXBalance } from './l1-balance';
import { queryL2KREXBalance } from './l2-balance';
import { queryKcc20KrexBalance } from './kcc20-balance';

export interface KREXBalanceResult {
  l1: number;
  l2: number;
  /** Wrapped KREX on L1 KCC20 (same economic claim when mint is live). */
  kcc20: number;
  total: number;
}

/**
 * Query KREX balance from L1, L2, and optional KCC20 wrap.
 *
 * @param l1Address - Kaspa address (with or without kaspa: prefix), or null
 * @param l2Address - EVM address (0x...), or null
 * @param chainId - Connected chain ID for L2 (determines KREX vs tKREX). Default 202555.
 * @returns Object with l1, l2, kcc20, and total balances
 */
export async function queryKREXBalance(
  l1Address: string | null,
  l2Address: string | null,
  chainId: number = 202555,
  opts?: { allowKasWareFallback?: boolean }
): Promise<KREXBalanceResult> {
  if (!l1Address && !l2Address) {
    return { l1: 0, l2: 0, kcc20: 0, total: 0 };
  }

  const [l1Balance, l2Balance, kcc20Balance] = await Promise.all([
    l1Address ? queryL1KREXBalance(l1Address, { allowKasWareFallback: opts?.allowKasWareFallback }) : Promise.resolve(0),
    l2Address ? queryL2KREXBalance(l2Address, chainId) : Promise.resolve(0),
    l1Address ? queryKcc20KrexBalance(l1Address) : Promise.resolve(0),
  ]);

  const total = l1Balance + l2Balance + kcc20Balance;

  console.log(`[KREX Balance] L1: ${l1Balance}, L2: ${l2Balance}, KCC20: ${kcc20Balance}, Total: ${total}`);

  return {
    l1: l1Balance,
    l2: l2Balance,
    kcc20: kcc20Balance,
    total,
  };
}
