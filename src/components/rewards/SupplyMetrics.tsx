'use client';

import type { RewardResult } from '@/lib/rewards/types';
import { formatNumber, formatLargeNumber } from '@/lib/rewards/calculator';

interface SupplyMetricsProps {
  result: RewardResult;
  className?: string;
}

export function SupplyMetrics({ result, className = '' }: SupplyMetricsProps) {
  if (!result.supplyMetrics) {
    return null;
  }

  const { 
    daysUntilGRTExhaustion, 
    daysUntilLRTExhaustion, 
    grtProgress, 
    lrtProgress,
    dailyGRTEmission,
    dailyLRTEmission,
  } = result.supplyMetrics;

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
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Token Supply Metrics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GRT Supply */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              GRT (GRID) Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {grtProgress.toFixed(2)}% minted
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 mb-3">
            <div
              className="bg-[#02abb8] h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, grtProgress)}%` }}
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Daily Emission:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(dailyGRTEmission)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Time Until Exhaustion:</span>
              <span className={`font-medium ${daysUntilGRTExhaustion < 365 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {formatDays(daysUntilGRTExhaustion)}
              </span>
            </div>
          </div>
        </div>

        {/* LRT Supply */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              LRT Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {lrtProgress.toFixed(2)}% minted
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 mb-3">
            <div
              className="bg-[#02abb8] h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, lrtProgress)}%` }}
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Daily Emission:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(dailyLRTEmission)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Time Until Exhaustion:</span>
              <span className={`font-medium ${daysUntilLRTExhaustion < 365 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {formatDays(daysUntilLRTExhaustion)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

