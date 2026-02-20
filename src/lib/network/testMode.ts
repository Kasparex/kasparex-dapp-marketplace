'use client';

/**
 * Hook and re-exports for test mode. Use testModeCore for SSR-safe isTestMode(chain).
 */
import { useChainId } from 'wagmi';
import { getChainById } from '@/lib/wagmi';
import { isTestMode, type ChainWithTestnet } from './testModeCore';

export type { ChainWithTestnet };

export { isTestMode };

/**
 * Hook: true when the connected chain is a testnet.
 */
export function useIsTestnet(): boolean {
  const chainId = useChainId();
  const chain = chainId ? getChainById(chainId) : null;
  return isTestMode(chain);
}
