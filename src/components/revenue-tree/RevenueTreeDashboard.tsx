'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { RevenueTreeStats } from './RevenueTreeStats';
import { RevenueTreeSidebar } from './RevenueTreeSidebar';
import { RevenueTreeSimulator } from './RevenueTreeSimulator';
import { RevenueTreeNetworkNudge } from './RevenueTreeNetworkNudge';
import { RevenueTreeActivationBox } from './RevenueTreeActivationBox';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { unifiedToRevenueTreeData } from '@/lib/revenue-tree/utils';

export interface RevenueTreeDashboardProps {
  /** Optional address to view as public profile. If not provided, shows connected wallet's dashboard. */
  viewAddress?: string;
}

export function RevenueTreeDashboard({ viewAddress }: RevenueTreeDashboardProps) {
  const { address: connectedAddress } = useAccount();
  const userWalletAddress = viewAddress || connectedAddress;

  const { tree, isLoading, isSupported } = useRevenueTree(
    viewAddress ? { userAddress: viewAddress as `0x${string}` } : {}
  );

  // One tree per wallet (on-chain); convert to legacy shape for list/stats
  const trees = useMemo(() => {
    const data = unifiedToRevenueTreeData(tree ?? null);
    return data ? [data] : [];
  }, [tree]);

  const totalRevenue = trees.reduce((sum, t) => sum + t.totalEarned, 0);
  const activeTrees = trees.filter(t => t.isActive).length;
  const totalDownline = 0; // V1: no downline count from contract yet
  const totalVolume = tree
    ? parseFloat(formatEther(BigInt(tree.lifetimeVolume)))
    : 0;

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <div className="flex-shrink-0">
        <RevenueTreeSidebar
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
          address={userWalletAddress}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
              Revenue Tree Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              One tree per wallet • Activation at 100 KAS • Maintenance 1000 KAS/30d or 10M KREX + 100 KAS/30d
            </p>
          </div>

          {!userWalletAddress && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
              Connect your wallet to view your Revenue Tree.
            </div>
          )}

          {userWalletAddress && !isSupported && !isLoading && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 text-sm">
              Revenue Tree is not deployed on this network.
            </div>
          )}

          {(userWalletAddress && isSupported) && (
            <>
              {/* Network Nudge (hidden if referrer is active) */}
              <RevenueTreeNetworkNudge address={userWalletAddress} />

              <RevenueTreeStats
                totalRevenue={totalRevenue}
                activeTrees={activeTrees}
                totalDownline={totalDownline}
                totalVolume={totalVolume}
              />

              {/* Activation Progress Bar */}
              <RevenueTreeActivationBox address={userWalletAddress} />

              {/* The Payment Simulator */}
              <RevenueTreeSimulator />

            </>
          )}
        </div>
      </div>
    </div>
  );
}
