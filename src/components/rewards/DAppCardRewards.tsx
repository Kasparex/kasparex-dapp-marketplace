'use client';

import { getMockLRTSupplyMetrics, getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface DAppCardRewardsProps {
  tokenTicker?: string | null;
  dAppContractAddress?: string | null;
  dAppExplorerUrl?: string | null;
  tokenAddress?: string | null;
  tokenExplorerUrl?: string | null;
  formatAddress?: (address: string | null) => string | null;
}

export function DAppCardRewards({ 
  tokenTicker,
  dAppContractAddress,
  dAppExplorerUrl,
  tokenAddress,
  tokenExplorerUrl,
  formatAddress,
}: DAppCardRewardsProps) {
  const lrtMetrics = getMockLRTSupplyMetrics();
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);

  const formatDays = (days: number): string => {
    if (days === Infinity || days > 36500) {
      return 'Never';
    }
    if (days >= 365) {
      const years = days / 365;
      return `${years.toFixed(1)} years`;
    }
    if (days >= 30) {
      const months = days / 30;
      return `${months.toFixed(1)} months`;
    }
    return `${Math.round(days)} days`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
      {/* LRT Supply Metrics */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {rewards.tokenTicker} Token Supply
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {lrtMetrics.progress.toFixed(2)}% minted
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
          <div
            className="bg-[#02abb8] h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, lrtMetrics.progress)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatLargeNumber(lrtMetrics.minted)} / {formatLargeNumber(lrtMetrics.maxSupply)}</span>
          <span>{formatDays(lrtMetrics.daysUntilExhaustion)}</span>
        </div>
      </div>

      {/* Contract Info Below Progress Bar */}
      <div className="flex items-center justify-between gap-4 pt-2 text-xs">
        {/* Dapp Contract (Left) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <svg className="w-3 h-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-zinc-600 dark:text-zinc-400">Dapp:</span>
          {dAppContractAddress && dAppExplorerUrl && formatAddress ? (
            <a
              href={dAppExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors truncate"
              title={dAppContractAddress}
            >
              {formatAddress(dAppContractAddress)}
            </a>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">—</span>
          )}
        </div>

        {/* Token Contract (Right) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <svg className="w-3 h-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-zinc-600 dark:text-zinc-400">Token:</span>
          {tokenAddress && tokenExplorerUrl && formatAddress ? (
            <a
              href={tokenExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors truncate"
              title={tokenAddress}
            >
              {formatAddress(tokenAddress)}
            </a>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

