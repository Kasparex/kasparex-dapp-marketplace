'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { getMockFlowTree, isDemoWalletSlug } from '@/lib/revenue-tree/mockFlowData';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { formatEther } from 'viem';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

const LEVEL_SHARES_L1_TO_L5 = [
  REVENUE_SHARE_PERCENTAGES.LEVEL_01,
  REVENUE_SHARE_PERCENTAGES.LEVEL_02,
  REVENUE_SHARE_PERCENTAGES.LEVEL_03,
  REVENUE_SHARE_PERCENTAGES.LEVEL_04,
  REVENUE_SHARE_PERCENTAGES.LEVEL_05,
];

function formatAddr(addr: string): string {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export interface RevenueTreeFlowViewProps {
  /** Wallet address (0x...) or demo slug (wallet-1 … wallet-6). */
  walletAddress: string;
  /** When provided, use this tree instead of fetching (avoids duplicate fetch in layout). */
  tree?: UnifiedRevenueTreeData | MockFlowTreeData | null;
  /** When true, content fits inside a column (no max-w-4xl). */
  embedded?: boolean;
}

export function RevenueTreeFlowView({ walletAddress, tree: treeProp, embedded = false }: RevenueTreeFlowViewProps) {
  const { address: connectedAddress } = useAccount();
  const isDemo = isDemoWalletSlug(walletAddress);
  const mockTree = isDemo ? getMockFlowTree(walletAddress) : null;

  const { tree: liveTree, isLoading, isSupported } = useRevenueTree(
    treeProp === undefined && !isDemo && walletAddress.startsWith('0x') ? { userAddress: walletAddress as `0x${string}` } : {}
  );

  const tree = treeProp !== undefined ? treeProp : (isDemo ? mockTree : liveTree);
  const chainId = tree?.chainId ?? 167012;
  const symbol = getNativeCurrencySymbol(chainId);

  /** Row data: level 1..5, sharePct, wallet, isYou (L1 = this tree's root), userCount */
  const levelsL1ToL5 =
    tree && 'upline' in tree
      ? [
          { level: 1, sharePct: LEVEL_SHARES_L1_TO_L5[0], wallet: (tree as { upline: string[] }).upline[0] ?? '', isYou: true, userCount: mockTree?.userCounts?.[0] ?? 0 },
          { level: 2, sharePct: LEVEL_SHARES_L1_TO_L5[1], wallet: (tree as { upline: string[] }).upline[1] ?? '', isYou: false, userCount: mockTree?.userCounts?.[1] ?? 0 },
          { level: 3, sharePct: LEVEL_SHARES_L1_TO_L5[2], wallet: (tree as { upline: string[] }).upline[2] ?? '', isYou: false, userCount: mockTree?.userCounts?.[2] ?? 0 },
          { level: 4, sharePct: LEVEL_SHARES_L1_TO_L5[3], wallet: (tree as { upline: string[] }).upline[3] ?? '', isYou: false, userCount: mockTree?.userCounts?.[3] ?? 0 },
          { level: 5, sharePct: LEVEL_SHARES_L1_TO_L5[4], wallet: (tree as { upline: string[] }).upline[4] ?? '', isYou: false, userCount: mockTree?.userCounts?.[4] ?? 0 },
        ]
      : [];

  /** Primary layout: Level 5 at TOP, Level 1 at BOTTOM (reverse for display). */
  const rowsTopToBottom = [...levelsL1ToL5].reverse();

  const referrer = tree && 'referrer' in tree ? (tree as { referrer: string | null }).referrer : null;
  const referrerSet = tree && 'referrerSet' in tree ? (tree as { referrerSet: boolean }).referrerSet : false;
  const hasReferrer = referrerSet && referrer;
  const lifetimeFormatted = tree && 'lifetimeVolume' in tree ? formatEther(BigInt((tree as { lifetimeVolume: string }).lifetimeVolume)) : '0';
  const volume30Formatted = tree && 'volumeLast30Days' in tree ? formatEther(BigInt((tree as { volumeLast30Days: string }).volumeLast30Days)) : '0';

  const wrapperClass = embedded ? 'w-full min-w-0 p-4 sm:p-6 lg:p-8' : 'max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8';

  if (!isDemo && !connectedAddress && !walletAddress.startsWith('0x')) {
    return (
      <div className={wrapperClass}>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
          Connect your wallet or open a demo flow (e.g. /revenue-tree/flow/wallet-1).
        </div>
      </div>
    );
  }

  if (!isDemo && !tree && (treeProp !== undefined || (!isSupported && !isLoading && !liveTree))) {
    return (
      <div className={wrapperClass}>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 text-sm">
          Revenue Tree is not deployed on this network, or no tree for this wallet.
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/revenue-tree/dashboard"
          className="text-sm font-medium text-[#02abb8] hover:underline"
        >
          ← Back to Revenue Tree Dashboard
        </Link>
        {connectedAddress && walletAddress.startsWith('0x') && connectedAddress.toLowerCase() === walletAddress.toLowerCase() && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">(Your tree)</span>
        )}
      </div>

      {!isDemo && treeProp === undefined && isLoading && !liveTree && (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
          Loading Revenue Tree…
        </div>
      )}

      {rowsTopToBottom.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Position
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white">
                You (payer)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Revenue from your payments goes to L2–L5 (or Genesis)
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Referrer
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-white truncate" title={referrer ?? ''}>
                {hasReferrer ? formatAddr(referrer!) : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Lifetime volume
              </div>
              <div className="text-lg font-bold text-[#02abb8]">
                {lifetimeFormatted} {symbol}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Volume (30d)
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {volume30Formatted} {symbol}
              </div>
            </div>
          </div>

          {/* Primary layout: Level 5 (top) → Level 1 (bottom) */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_1fr] gap-x-4 gap-y-0 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <div>Level</div>
              <div>Revenue share</div>
              <div>Wallet / Referrer</div>
              <div>Users</div>
              <div>Role</div>
            </div>
            {rowsTopToBottom.map((row, index) => (
              <div
                key={row.level}
                className={`grid grid-cols-[auto_1fr_1fr_auto_1fr] gap-x-4 gap-y-2 px-4 py-4 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 items-center ${row.isYou ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#02abb8]/20 text-[#02abb8] font-black text-sm">
                    {row.level}
                  </span>
                  {index < rowsTopToBottom.length - 1 && (
                    <span className="text-zinc-400 dark:text-zinc-500">↓</span>
                  )}
                </div>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {row.sharePct}%
                </div>
                <div className="font-mono text-sm text-zinc-700 dark:text-zinc-300 truncate" title={row.wallet}>
                  {row.wallet ? formatAddr(row.wallet) : '—'}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {row.userCount > 0 ? row.userCount : '—'}
                </div>
                <div className="text-sm">
                  {row.isYou ? (
                    <span className="inline-flex px-2 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400 font-medium">
                      You
                    </span>
                  ) : row.wallet && row.wallet !== '0x0000000000000000000000000000000000000000' ? (
                    <span className="inline-flex px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400">
                      Referrer
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            When you spend, the share goes to the wallets above (L2–L5 or Genesis), not to you. You earn when someone pays through your referral link — you are in their tree and receive that level’s share; the same continues up the chain.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Demo flows:</span>
            {['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6'].map((slug) => (
              <Link
                key={slug}
                href={`/revenue-tree/flow/${slug}`}
                className={`text-sm font-medium px-2 py-1 rounded ${walletAddress === slug ? 'bg-[#02abb8]/20 text-[#02abb8]' : 'text-violet-600 dark:text-violet-400 hover:underline'}`}
              >
                {slug}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
