'use client';

import type { RewardResult } from '@/lib/rewards/types';
import { formatNumber, formatLargeNumber } from '@/lib/rewards/calculator';

interface PointsDisplayProps {
  result: RewardResult;
  className?: string;
}

export function PointsDisplay({ result, className = '' }: PointsDisplayProps) {
  return (
    <div className={`p-6 bg-gradient-to-br from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border border-[#02abb8]/20 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            XP Points Earned
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Collectible reward points for extra perks
          </p>
        </div>
        <div className="text-3xl font-bold text-[#02abb8]">
          {formatLargeNumber(result.finalXP)}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Base Points:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatNumber(result.baseXP, 0)}
          </span>
        </div>
        {result.pointsMultiplier > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Multiplier:</span>
            <span className="font-medium text-[#02abb8]">
              {result.pointsMultiplier}x
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <span className="text-zinc-900 dark:text-zinc-100">Total Points:</span>
          <span className="text-[#02abb8]">
            {formatNumber(result.finalXP, 0)}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          💡 Points can be exchanged for NFTs, skins, discounts, boosts, merch, profile badges, special events, and raffles.
        </p>
      </div>
    </div>
  );
}

