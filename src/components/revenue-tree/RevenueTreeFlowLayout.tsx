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
import { RevenueTreeFlowDemoPanel } from './RevenueTreeFlowDemoPanel';
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
              L1=you, L2=referrer, L3–L5 up the chain (Genesis fills gaps). Your spend uses this tree (2% you, 5–45% L2–L5). Referrals put you at L2+ in their trees.
            </p>
            <div className="rounded-lg bg-[#02abb8]/15 dark:bg-[#02abb8]/20 border border-[#02abb8]/40 px-3 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tree for:</span>
              <div className="text-base font-bold text-[#02abb8] mt-0.5 font-mono break-all" title={walletAddress}>
                {formatWalletDisplay(walletAddress, isDemo)}
              </div>
            </div>
            {isDemo && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Demo data.
              </p>
            )}
          </div>
          <RevenueTreeFlowDemoPanel tree={tree} symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
