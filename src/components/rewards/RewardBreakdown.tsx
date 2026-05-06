'use client';

import type { RewardResult } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface RewardBreakdownProps {
  result: RewardResult;
  className?: string;
}

export function RewardBreakdown({ result, className = '' }: RewardBreakdownProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Reward Breakdown
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">GRID</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Ecosystem rewards</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatLargeNumber(result.finalGrid)}
            </div>
            {(result.krexMultiplier > 1 ||
              result.nftMultiplier > 1 ||
              result.nodeMultiplier > 1 ||
              result.seasonalMultiplier > 1) && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Base: {formatLargeNumber(result.baseGrid)} × {result.totalMultiplier.toFixed(2)}x
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pts (simulator)</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Calculator model only</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-[#02abb8]">{formatLargeNumber(result.finalXP)}</div>
            {result.pointsMultiplier > 1 && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Base: {formatLargeNumber(result.baseXP)} × {result.pointsMultiplier}x
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
