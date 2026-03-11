'use client';

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { getMockFlowTree, isDemoWalletSlug, DEMO_LABELS } from '@/lib/revenue-tree/mockFlowData';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { RevenueTreeSidebar } from './RevenueTreeSidebar';
import { RevenueTreeFlowView } from './RevenueTreeFlowView';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';

function formatWalletDisplay(walletAddress: string, isDemo: boolean): string {
  if (isDemo && DEMO_LABELS[walletAddress]) return DEMO_LABELS[walletAddress];
  if (!walletAddress || walletAddress === '0x0000000000000000000000000000000000000000') return '—';
  return `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
}

export interface RevenueTreeFlowLayoutProps {
  walletAddress: string;
}

function getSidebarStats(tree: UnifiedRevenueTreeData | MockFlowTreeData | null) {
  if (!tree) {
    return { totalRevenue: 0, activeTrees: 0, totalDownline: 0 };
  }
  const totalRevenue =
    tree && 'totalEarned' in tree && tree.totalEarned
      ? parseFloat(formatEther(BigInt(tree.totalEarned)))
      : 0;
  const activeTrees =
    tree && 'activatedAt' in tree
      ? (tree.activatedAt ? 1 : 0)
      : (tree && 'isActive' in tree ? ((tree as any).isActive ? 1 : 0) : 0);
  const totalDownline =
    tree && 'treesWhereOwnerAtLevel' in tree
      ? tree.treesWhereOwnerAtLevel.slice(1).reduce((a, b) => a + b, 0)
      : 0;
  return { totalRevenue, activeTrees, totalDownline };
}

export function RevenueTreeFlowLayout({ walletAddress }: RevenueTreeFlowLayoutProps) {

  const isDemo = isDemoWalletSlug(walletAddress);
  const mockTree = useMemo(() => (isDemo ? getMockFlowTree(walletAddress) : null), [isDemo, walletAddress]);

  const { tree: liveTree, isLoading, isSupported } = useRevenueTree(
    !isDemo && walletAddress.startsWith('0x') ? { address: walletAddress as `0x${string}` } : {}
  );

  const tree = isDemo ? mockTree : liveTree;
  const chainId = tree?.chainId ?? 167012;
  const symbol = getNativeCurrencySymbol(chainId);

  const { totalRevenue, activeTrees, totalDownline } = useMemo(() => getSidebarStats(tree), [tree]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <RevenueTreeSidebar
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <RevenueTreeSidebar
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
              {isDemo ? (DEMO_LABELS[walletAddress] || 'Demo Tree') : 'Structural Tree Flow'}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              {isDemo 
                ? 'Visualizing structural nodes and representative upline distribution.' 
                : `Network path for ${walletAddress}. View structural levels and revenue distribution.`}
            </p>
          </div>

          <RevenueTreeFlowView walletAddress={walletAddress} tree={tree} />
        </div>
      </div>
    </div>
  );
}
