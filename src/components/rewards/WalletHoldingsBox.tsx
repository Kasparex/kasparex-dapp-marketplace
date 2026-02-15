'use client';

import { useAccount } from 'wagmi';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function WalletHoldingsBox() {
  const { address, isConnected } = useAccount();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        Wallet Holdings
      </h3>
      
      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Connect wallet to view holdings
          </p>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            GRID (GRT) and balances
          </div>
        </div>
      ) : holdings ? (
        <div className="space-y-3">
          {/* GRT Balance */}
          <div className="pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                GRT (GRID)
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(holdings.grt)}
              </span>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}

