'use client';

import { getMockGRTSupplyMetrics } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function GRTInfoBox() {
  const metrics = getMockGRTSupplyMetrics();

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
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        GRT (GRID) Token
      </h3>
      
      <div className="space-y-3">
        {/* Max Supply and Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Max Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {metrics.progress.toFixed(2)}% minted
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-[#02abb8] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, metrics.progress)}%` }}
            />
          </div>
          
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatLargeNumber(metrics.minted)} / {formatLargeNumber(metrics.maxSupply)}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Daily Emission:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatLargeNumber(metrics.dailyEmission)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Time Until Exhaustion:</span>
            <span className={`font-medium ${metrics.daysUntilExhaustion < 365 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {formatDays(metrics.daysUntilExhaustion)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

