'use client';

import { useAccount } from 'wagmi';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function GRIDHoldingsBox() {
  const { address, isConnected } = useAccount();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        GRID (GRT) Token
      </h3>
      
      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Connect wallet to view GRID balance
          </p>
        </div>
      ) : holdings ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Balance
            </span>
            <span className="text-xl font-bold text-[#02abb8]">
              {formatLargeNumber(holdings.grt)}
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            Global Reward Token
          </div>
        </div>
      ) : null}
    </div>
  );
}

