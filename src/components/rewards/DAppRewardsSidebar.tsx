'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { 
  getDefaultRewardsBreakdown, 
  getMockLRTSupplyMetrics,
  getMockGRTSupplyMetrics,
  MOCK_REWARDS_CONFIG 
} from '@/lib/rewards/mockData';
import { formatLargeNumber, formatNumber } from '@/lib/rewards/calculator';
import { DEFAULT_FEE_DISTRIBUTION } from '@/lib/rewards/types';

interface DAppRewardsSidebarProps {
  tokenTicker?: string | null;
  dappName?: string;
}

export function DAppRewardsSidebar({ tokenTicker, dappName }: DAppRewardsSidebarProps) {
  const { address, isConnected } = useAccount();
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);
  const lrtMetrics = getMockLRTSupplyMetrics();
  const grtMetrics = getMockGRTSupplyMetrics();
  
  // Mock user status (for simulation)
  const mockKrexTier = 'Tier0'; // Default tier
  const mockKrexMultiplier = 1;
  const mockNftMultiplier = 1;
  const mockNodeMultiplier = 1;
  const mockSeasonalMultiplier = 1;
  const mockTotalMultiplier = mockKrexMultiplier * mockNftMultiplier * mockNodeMultiplier * mockSeasonalMultiplier;
  const mockPointsMultiplier = mockKrexMultiplier * mockNftMultiplier;
  
  // Calculate final fee (with potential reductions)
  const baseFee = MOCK_REWARDS_CONFIG.DEFAULT_FEE_PERCENT;
  const finalFee = baseFee; // No reductions in default simulation
  
  // Example calculation
  const exampleKasAmount = 1;
  const exampleGRT = exampleKasAmount * rewards.grtPerKas * mockTotalMultiplier;
  const exampleLRT = exampleKasAmount * rewards.lrtPerKas * mockTotalMultiplier;
  const exampleXP = exampleKasAmount * rewards.xpPerKas * mockPointsMultiplier;
  const exampleFee = (exampleKasAmount * finalFee) / 100;

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
    <div className="space-y-4">
      {/* Rewards & Metrics Box */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rewards & Metrics
          </h3>
          <Link
            href="/rewards-calculator"
            className="px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Calculator
          </Link>
        </div>
        <div className="space-y-3">
          {/* Base Rates */}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Base Rates (per 1 KAS):
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">GRT (GRID):</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatLargeNumber(rewards.grtPerKas)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {rewards.tokenTicker} (LRT):
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatLargeNumber(rewards.lrtPerKas)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">XP Points:</span>
                <span className="font-medium text-[#02abb8]">
                  {formatLargeNumber(rewards.xpPerKas)}
                </span>
              </div>
            </div>
          </div>

          {/* GRT Supply Metrics */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                GRT (GRID) Supply
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {grtMetrics.progress.toFixed(2)}% minted
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-1">
              <div
                className="bg-[#02abb8] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, grtMetrics.progress)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatLargeNumber(grtMetrics.minted)} / {formatLargeNumber(grtMetrics.maxSupply)}
            </div>
          </div>

          {/* LRT Supply Metrics */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {rewards.tokenTicker} Supply
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {lrtMetrics.progress.toFixed(2)}% minted
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-1">
              <div
                className="bg-[#02abb8] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, lrtMetrics.progress)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatLargeNumber(lrtMetrics.minted)} / {formatLargeNumber(lrtMetrics.maxSupply)}
            </div>
          </div>
        </div>
      </div>

      {/* KREX/NFT Multipliers Box */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          KREX/NFT Multipliers
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">KREX Tier:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {mockKrexTier} ({mockKrexMultiplier}x)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">NFT Multiplier:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {mockNftMultiplier}x
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Total Multiplier:</span>
              <span className="font-bold text-[#02abb8]">
                {mockTotalMultiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Box */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Fees
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Base Fee:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {baseFee}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Final Fee:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {finalFee}%
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Fee Distribution:
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Kasparex:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {DEFAULT_FEE_DISTRIBUTION.KASPAREX}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">GRT Treasury:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {DEFAULT_FEE_DISTRIBUTION.GRT_TREASURY}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">LRT Treasury:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {DEFAULT_FEE_DISTRIBUTION.LRT_TREASURY}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Boosters Box */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Seasonal Boosters
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Current Boost:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {((mockSeasonalMultiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {mockSeasonalMultiplier > 1 ? 'Active boosters applied' : 'No active boosters'}
          </div>
        </div>
      </div>

      {/* Node Provider Rewards Box (Optional) */}
      {mockNodeMultiplier > 1 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Node Provider Rewards
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Node Multiplier:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {mockNodeMultiplier}x
              </span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Active node provider benefits
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

