'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { RevenueTreeData, RevenueTreeContentType } from '@/lib/revenue-tree/types';
import { generateReferralLink } from '@/lib/revenue-tree/referral';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

/** Default amount (in native token) used to compute per-level iKAS split when amountSpent not provided. */
const DEFAULT_AMOUNT_SPENT = 10;
/** Default tree BPS (1000 = 10% of payment goes to revenue tree). */
const DEFAULT_TREE_BPS = 1000;

interface RevenueTreeListProps {
  trees: RevenueTreeData[];
  activeTab: RevenueTreeContentType | 'all';
  /** Optional: amount spent in native token (e.g. iKAS) to compute per-level split. */
  amountSpent?: number;
  /** Optional: revenue tree share in BPS (10000 = 100%). Default 1000 = 10%. */
  treeBps?: number;
}

export function RevenueTreeList({ trees, activeTab, amountSpent = DEFAULT_AMOUNT_SPENT, treeBps = DEFAULT_TREE_BPS }: RevenueTreeListProps) {
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  // Filter trees based on active tab
  const filteredTrees = activeTab === 'all' 
    ? trees 
    : trees.filter(tree => tree.contentType === activeTab);

  const amountToTree = (amountSpent * treeBps) / 10000;
  const getLevelShare = (sharePercentage: number) => (amountToTree * sharePercentage) / 100;
  const formatShortAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—');

  if (filteredTrees.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-zinc-500 dark:text-zinc-400 font-bold">No revenue trees found</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Activate a revenue tree by using a dApp or purchasing content</p>
      </div>
    );
  }

  const getContentUrl = (tree: RevenueTreeData) => {
    if (tree.contentType === 'magazine') {
      return `/magazines/${tree.contentSlug}/${tree.issueNumber}`;
    }
    const pluralMap: Record<RevenueTreeContentType, string> = {
      dapp: 'dapps',
      magazine: 'magazines',
      vblog: 'vblog',
      game: 'games',
      store: 'store',
    };
    return `/${pluralMap[tree.contentType]}/${tree.contentSlug}`;
  };

  const getContentName = (tree: RevenueTreeData) => {
    if (tree.contentType === 'magazine') {
      return `${tree.contentSlug} #${tree.issueNumber}`;
    }
    return tree.contentSlug;
  };

  return (
    <div className="space-y-4">
      {filteredTrees.map((tree) => (
        <div
          key={tree.dappId}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={getContentUrl(tree)}
                  className="text-lg font-black text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors"
                >
                  {getContentName(tree)}
                </Link>
                <span
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                    tree.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {tree.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {tree.contentType.charAt(0).toUpperCase() + tree.contentType.slice(1)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Total Earned
              </div>
              <div className="text-xl font-black text-[#02abb8]">
                {tree.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">{nativeSymbol}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Downline Count
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {tree.revenueTreesCount}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Levels Active
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {tree.levels.filter(l => l.userCount > 0).length} / 5
              </div>
            </div>
          </div>

          {/* Per-level iKAS split (based on amountSpent) */}
          <div className="mb-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Split per level (for {amountSpent} {nativeSymbol} spent, {(treeBps / 100).toFixed(0)}% to tree)
            </div>
            <div className="space-y-3 font-mono text-sm">
              {tree.levels.map((level) => {
                const share = getLevelShare(level.sharePercentage);
                return (
                  <div key={level.level} className="space-y-1">
                    <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                      <span>LEVEL {level.level}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">Users</span>
                      <span className="font-semibold text-[#02abb8]">{level.sharePercentage}% Share</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 pl-2">
                      <span className="truncate max-w-[120px]" title={level.walletAddress}>{formatShortAddress(level.walletAddress)}</span>
                      <span>{level.userCount}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{share.toFixed(2)} {nativeSymbol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href={getContentUrl(tree)}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm uppercase tracking-wider rounded-lg transition-colors text-center"
            >
              View Content
            </Link>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tree.referralLink);
              }}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#0299a6] text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
