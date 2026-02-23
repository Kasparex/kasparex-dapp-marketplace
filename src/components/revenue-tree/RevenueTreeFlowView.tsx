'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
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

export function RevenueTreeFlowView() {
  const { address: userWalletAddress } = useAccount();
  const { tree, isLoading, isSupported } = useRevenueTree();

  if (!userWalletAddress) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
          Connect your wallet to view your Revenue Tree flow.
        </div>
      </div>
    );
  }

  if (!isSupported && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 text-sm">
          Revenue Tree is not deployed on this network.
        </div>
      </div>
    );
  }

  const levels = tree
    ? [
        { level: 1, sharePct: LEVEL_SHARES_L1_TO_L5[0], wallet: tree.upline[0] ?? '', isYou: true },
        { level: 2, sharePct: LEVEL_SHARES_L1_TO_L5[1], wallet: tree.upline[1] ?? '', isYou: false },
        { level: 3, sharePct: LEVEL_SHARES_L1_TO_L5[2], wallet: tree.upline[2] ?? '', isYou: false },
        { level: 4, sharePct: LEVEL_SHARES_L1_TO_L5[3], wallet: tree.upline[3] ?? '', isYou: false },
        { level: 5, sharePct: LEVEL_SHARES_L1_TO_L5[4], wallet: tree.upline[4] ?? '', isYou: false },
      ]
    : [];

  const hasReferrer = tree?.referrerSet && tree?.referrer;
  const lifetimeFormatted = tree ? formatEther(BigInt(tree.lifetimeVolume)) : '0';
  const volume30Formatted = tree ? formatEther(BigInt(tree.volumeLast30Days)) : '0';

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/revenue-tree/dashboard"
          className="text-sm font-medium text-[#02abb8] hover:underline"
        >
          ← Back to Revenue Tree Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
          Revenue Tree Flow
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Matrix view: bottom = you (Level 1), top = Level 5. Referrers above you; revenue share and your position.
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
          Loading your Revenue Tree…
        </div>
      )}

      {!isLoading && tree && (
        <>
          {/* Your position & quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Your position
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white">
                Level 1 (2% share)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Base of your tree
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Referrer
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-white truncate" title={tree.referrer ?? ''}>
                {hasReferrer ? formatAddr(tree.referrer!) : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Lifetime volume
              </div>
              <div className="text-lg font-bold text-[#02abb8]">
                {lifetimeFormatted} {getNativeCurrencySymbol(tree.chainId)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Volume (30d)
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {volume30Formatted} {getNativeCurrencySymbol(tree.chainId)}
              </div>
            </div>
          </div>

          {/* Matrix: bottom (Level 1) to top (Level 5) */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_1fr] gap-x-4 gap-y-0 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <div>Level</div>
              <div>Revenue share</div>
              <div>Wallet / Referrer</div>
              <div>Users</div>
              <div>Role</div>
            </div>
            {levels.map((row, index) => (
              <div
                key={row.level}
                className={`grid grid-cols-[auto_1fr_1fr_auto_1fr] gap-x-4 gap-y-2 px-4 py-4 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 items-center ${row.isYou ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#02abb8]/20 text-[#02abb8] font-black text-sm">
                    {row.level}
                  </span>
                  {index < levels.length - 1 && (
                    <span className="text-zinc-300 dark:text-zinc-600">↑</span>
                  )}
                </div>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {row.sharePct}%
                </div>
                <div className="font-mono text-sm text-zinc-700 dark:text-zinc-300 truncate" title={row.wallet}>
                  {row.wallet ? formatAddr(row.wallet) : '—'}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  —
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
            Revenue flows upward: when you earn, Level 2–5 referrers receive their share. User counts per level will appear when indexer data is available.
          </p>
        </>
      )}
    </div>
  );
}
