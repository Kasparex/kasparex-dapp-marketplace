'use client';

/**
 * Single source of truth for "test mode" (testnet).
 * Use this everywhere instead of hardcoding chain IDs.
 */

import { useChainId } from 'wagmi';
import { getChainById } from '@/lib/wagmi';

export interface ChainWithTestnet {
  testnet?: boolean;
}

/**
 * Returns true when the current chain is a testnet.
 * Use for labels (tGRID vs GRID), banners, and test-only logic.
 */
export function isTestMode(chain: ChainWithTestnet | null | undefined): boolean {
  return chain?.testnet ?? false;
}

/**
 * Hook: true when the connected chain is a testnet.
 */
export function useIsTestnet(): boolean {
  const chainId = useChainId();
  const chain = chainId ? getChainById(chainId) : null;
  return isTestMode(chain);
}
