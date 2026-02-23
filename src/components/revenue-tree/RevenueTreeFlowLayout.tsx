'use client';

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { getMockFlowTree, isDemoWalletSlug } from '@/lib/revenue-tree/mockFlowData';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { RevenueTreeSidebar } from './RevenueTreeSidebar';
import { RevenueTreeFlowView } from './RevenueTreeFlowView';
import { RevenueTreeFlowDemoPanel } from './RevenueTreeFlowDemoPanel';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';

function formatWalletDisplay(walletAddress: string, isDemo: boolean): string {
  if (isDemo) return walletAddress;
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
  const activeTrees = tree.isActive ? 1 : 0;
  const totalDownline =
    tree && 'userCounts' in tree
      ? Math.max(0, tree.userCounts.reduce((a, b) => a + b, 0) - 1)
      : 0;
  return { totalRevenue, activeTrees, totalDownline };
}

export function RevenueTreeFlowLayout({ walletAddress }: RevenueTreeFlowLayoutProps) {
  const [activeTab, setActiveTab] = useState<RevenueTreeContentType | 'all'>('all');

  const isDemo = isDemoWalletSlug(walletAddress);
  const mockTree = useMemo(() => (isDemo ? getMockFlowTree(walletAddress) : null), [isDemo, walletAddress]);

  const { tree: liveTree, isLoading, isSupported } = useRevenueTree(
    !isDemo && walletAddress.startsWith('0x') ? { userAddress: walletAddress as `0x${string}` } : {}
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <RevenueTreeSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Main: two columns — table (left) | demo panel (right) */}
      <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6 lg:p-8 lg:pl-6">
        <div className="flex-1 min-w-0">
          <RevenueTreeFlowView walletAddress={walletAddress} tree={tree} embedded />
        </div>
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-8 h-fit space-y-4">
          {/* Flow header: title, description, Tree for (highlighted), demo note */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
              Revenue Tree Flow
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              Your tree is created at activation: L1=you, L2=your referrer, L3=referrer’s L2, L4=referrer’s L3, L5=referrer’s L4 (Genesis fills gaps). When you spend, this tree is used: you (L1) get 2%, L2–L5 get 5–45%. When someone you referred spends, you are L2 in their tree and get 5% of that payment; the same continues up the chain.
            </p>
            <div className="rounded-lg bg-[#02abb8]/15 dark:bg-[#02abb8]/20 border border-[#02abb8]/40 px-3 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tree for:</span>
              <div className="text-base font-bold text-[#02abb8] mt-0.5 font-mono break-all" title={walletAddress}>
                {formatWalletDisplay(walletAddress, isDemo)}
              </div>
            </div>
            {isDemo && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Demo data — different structures and user distributions for illustration.
              </p>
            )}
          </div>
          <RevenueTreeFlowDemoPanel tree={tree} symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
