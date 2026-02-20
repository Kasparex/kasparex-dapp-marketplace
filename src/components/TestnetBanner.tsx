'use client';

import { useChainId } from 'wagmi';
import { getChainById } from '@/lib/wagmi';
import { isTestMode } from '@/lib/network/testModeCore';

/**
 * Global banner shown when the connected chain is a testnet.
 * Renders a slim bar at the top so users know they are on test tokens (tGRID, etc.).
 */
export function TestnetBanner() {
  const chainId = useChainId();
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = isTestMode(chain);

  if (!isTestnet) return null;

  return (
    <div
      className="w-full py-1.5 px-4 text-center text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800"
      role="status"
      aria-live="polite"
    >
      Test network — tGRID and test tokens only. No real value.
    </div>
  );
}
