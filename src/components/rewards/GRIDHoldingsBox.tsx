'use client';

import { useAccount } from 'wagmi';
import { getMockWalletHoldings, getMockGRTSupplyMetrics } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function GRIDHoldingsBox() {
  const { address, isConnected } = useAccount();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;
  const grtMetrics = getMockGRTSupplyMetrics();

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        GRID (GRT) Token
      </h3>
      
      <div className="space-y-3">
        {/* Progress Bar Metrics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Max Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {grtMetrics.progress.toFixed(2)}% minted
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-[#02abb8] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, grtMetrics.progress)}%` }}
            />
          </div>
          
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatLargeNumber(grtMetrics.minted)} / {formatLargeNumber(grtMetrics.maxSupply)}
          </div>
        </div>

        {/* Balance (if connected) */}
        {isConnected && holdings ? (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Your Balance
              </span>
              <span className="text-xl font-bold text-[#02abb8]">
                {formatLargeNumber(holdings.grt)}
              </span>
            </div>
          </div>
        ) : !isConnected ? (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connect wallet to view balance
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

