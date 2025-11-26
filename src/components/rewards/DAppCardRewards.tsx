'use client';

import { getMockLRTSupplyMetrics, getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface DAppCardRewardsProps {
  tokenTicker?: string | null;
}

export function DAppCardRewards({ tokenTicker }: DAppCardRewardsProps) {
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
    <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
      {/* LRT Supply Metrics */}
      <div className="space-y-2">
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

      {/* Fees & Rewards */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Fees & Rewards
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Fee:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {rewards.feePercent}%
            </span>
          </div>
          <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              1 KAS spent = {formatLargeNumber(rewards.grtPerKas)} GRT → {formatLargeNumber(rewards.lrtPerKas)} {rewards.tokenTicker} → {formatLargeNumber(rewards.xpPerKas)} XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

