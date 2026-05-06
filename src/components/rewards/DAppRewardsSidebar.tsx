'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { DEFAULT_FEE_DISTRIBUTION, DEFAULT_BASE_FEE_PERCENT } from '@/lib/rewards/types';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getChainById } from '@/lib/wagmi';

interface DAppRewardsSidebarProps {
  dappName?: string;
}

export function DAppRewardsSidebar({ dappName }: DAppRewardsSidebarProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const rewards = getDefaultRewardsBreakdown(chainId);

  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const gridTokenAddress = useMemo(() => {
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId, isTestnet]);

  const { totalSupply, maxSupply, isLoading: gridLoading } = useGRIDToken(gridTokenAddress);
  const gridMetrics = useMemo(() => {
    if (totalSupply != null && maxSupply != null && Number(maxSupply) > 0) {
      const minted = Number(totalSupply) / 1e18;
      const max = Number(maxSupply) / 1e18;
      return { minted, maxSupply: max, progress: (minted / max) * 100 };
    }
    return null;
  }, [totalSupply, maxSupply]);
  
  const mockKrexTier = 'Tier1';
  const mockKrexMultiplier = 1;
  const mockNftMultiplier = 1;
  const mockNodeMultiplier = 1;
  const mockSeasonalMultiplier = 1;
  const mockTotalMultiplier = mockKrexMultiplier * mockNftMultiplier * mockNodeMultiplier * mockSeasonalMultiplier;
  const mockPointsMultiplier = mockKrexMultiplier * mockNftMultiplier;
  
  const baseFee = DEFAULT_BASE_FEE_PERCENT;
  const finalFee = baseFee;
  
  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rewards & Metrics
          </h3>
        </div>
        <div className="space-y-3">
          {/* Base rates (GRID) */}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Base Rates (per 1 KAS):
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">GRID:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatLargeNumber(rewards.gridPerKas)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Hub pts (Kaspa Rewards)</span>
                <Link href="/rewards#rewards-points" className="font-medium text-[#02abb8] hover:underline">
                  View earn table
                </Link>
              </div>
            </div>
          </div>

          {/* GRID supply (on-chain where available) */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                GRID Supply
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {gridMetrics ? `${gridMetrics.progress.toFixed(2)}% minted` : (gridLoading ? '...' : '-')}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-1">
              <div
                className="bg-[#02abb8] h-2 rounded-full transition-all"
                style={{ width: `${gridMetrics ? Math.min(100, gridMetrics.progress) : 0}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {gridMetrics ? `${formatLargeNumber(gridMetrics.minted)} / ${formatLargeNumber(gridMetrics.maxSupply)}` : (gridLoading && gridTokenAddress ? '...' : '-')}
            </div>
          </div>

          {/* Fees Section */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Fees
            </h4>
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
                    <span className="text-zinc-600 dark:text-zinc-400">GRID treasury:</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {DEFAULT_FEE_DISTRIBUTION.GRID_TREASURY}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/rewards-calculator"
              className="block w-full px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Calculator
            </Link>
          </div>
        </div>
      </div>

      {mockNodeMultiplier > 1 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
    </>
  );
}
