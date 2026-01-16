'use client';

import type { RewardResult } from '@/lib/rewards/types';
import { formatNumber } from '@/lib/rewards/calculator';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';

interface FeeDistributionProps {
  result: RewardResult;
  kasAmount: number;
  className?: string;
}

export function FeeDistribution({
  result,
  kasAmount,
  className = '',
}: FeeDistributionProps) {
  const { feeAmount, feePercent, feeDistribution } = result;

  // Calculate percentages for visualization
  const total = feeDistribution.kasparex + feeDistribution.grtTreasury + feeDistribution.lrtTreasury;
  const kasparexPercent = total > 0 ? (feeDistribution.kasparex / total) * 100 : 0;
  const grtPercent = total > 0 ? (feeDistribution.grtTreasury / total) * 100 : 0;
  const lrtPercent = total > 0 ? (feeDistribution.lrtTreasury / total) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Fee Distribution
      </h3>

      {/* Fee Summary */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Transaction Fee
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            {feePercent.toFixed(2)}% of {formatNumber(kasAmount, 2)} <TokenLogoImage tokenId="kas" size={14} /> KAS
          </span>
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <TokenLogoImage tokenId="kas" size={28} />
          {formatNumber(feeAmount, 4)} KAS
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-600 dark:text-zinc-400">Distribution:</span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {Math.round((feeDistribution.kasparex / total) * 100)}% / {Math.round((feeDistribution.grtTreasury / total) * 100)}% / {Math.round((feeDistribution.lrtTreasury / total) * 100)}%
          </span>
        </div>

        {/* Visual Bar */}
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden flex">
          <div
            className="bg-[#02abb8] flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${kasparexPercent}%` }}
            title="Kasparex Treasury: 60%"
          >
            {kasparexPercent > 10 && '60%'}
          </div>
          <div
            className="bg-[#02abb8]/70 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${grtPercent}%` }}
            title="GRT Treasury: 20%"
          >
            {grtPercent > 10 && '20%'}
          </div>
          <div
            className="bg-[#02abb8]/50 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${lrtPercent}%` }}
            title="LRT Treasury: 20%"
          >
            {lrtPercent > 10 && '20%'}
          </div>
        </div>

        {/* Distribution Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Kasparex Treasury
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <TokenLogoImage tokenId="kas" size={14} />
              {formatNumber(feeDistribution.kasparex, 4)} KAS
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              60% - Development & Operations
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              GRT Treasury
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <TokenLogoImage tokenId="kas" size={14} />
              {formatNumber(feeDistribution.grtTreasury, 4)} KAS
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              20% - GRID Token Support
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              LRT Treasury
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <TokenLogoImage tokenId="kas" size={14} />
              {formatNumber(feeDistribution.lrtTreasury, 4)} KAS
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              20% - dApp Token Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

