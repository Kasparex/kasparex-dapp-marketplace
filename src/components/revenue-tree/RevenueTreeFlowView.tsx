'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { getMockFlowTree, isDemoWalletSlug, DEMO_LABELS, getDemoWalletLabel } from '@/lib/revenue-tree/mockFlowData';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { formatEther } from 'viem';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { RevenueTreeFlowLevelModal } from './RevenueTreeFlowLevelModal';

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

function walletDisplay(wallet: string, isDemo: boolean): string {
  if (isDemo && wallet) {
    const label = getDemoWalletLabel(wallet);
    if (label) return label;
  }
  return formatAddr(wallet);
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
  const [modalRow, setModalRow] = useState<{
    level: number;
    sharePct: number;
    wallet: string;
    isYou: boolean;
    treesAtLevel: number;
    revenueShareWei?: string;
    treeSlugsAtLevel: string[];
  } | null>(null);

  const { tree: liveTree, isLoading, isSupported } = useRevenueTree(
    treeProp === undefined && !isDemo && walletAddress.startsWith('0x') ? { userAddress: walletAddress as `0x${string}` } : {}
  );

  const tree = treeProp !== undefined ? treeProp : (isDemo ? mockTree : liveTree);
  const chainId = tree?.chainId ?? 167012;
  const symbol = getNativeCurrencySymbol(chainId);

  /** Row data: level, sharePct, wallet, isYou, treesAtLevel, revenueShareWei, treeSlugsAtLevel */
  const levelsL1ToL5 =
    tree && 'upline' in tree
      ? [
          { level: 1, sharePct: LEVEL_SHARES_L1_TO_L5[0], wallet: (tree as { upline: string[] }).upline[0] ?? '', isYou: true, treesAtLevel: (mockTree as MockFlowTreeData | undefined)?.treesWhereOwnerAtLevel?.[0] ?? 0, revenueShareWei: (mockTree as MockFlowTreeData | undefined)?.revenueShareByLevelWei?.[0], treeSlugsAtLevel: (mockTree as MockFlowTreeData | undefined)?.treeSlugsWhereOwnerAtLevel?.[0] ?? [] },
          { level: 2, sharePct: LEVEL_SHARES_L1_TO_L5[1], wallet: (tree as { upline: string[] }).upline[1] ?? '', isYou: false, treesAtLevel: (mockTree as MockFlowTreeData | undefined)?.treesWhereOwnerAtLevel?.[1] ?? 0, revenueShareWei: (mockTree as MockFlowTreeData | undefined)?.revenueShareByLevelWei?.[1], treeSlugsAtLevel: (mockTree as MockFlowTreeData | undefined)?.treeSlugsWhereOwnerAtLevel?.[1] ?? [] },
          { level: 3, sharePct: LEVEL_SHARES_L1_TO_L5[2], wallet: (tree as { upline: string[] }).upline[2] ?? '', isYou: false, treesAtLevel: (mockTree as MockFlowTreeData | undefined)?.treesWhereOwnerAtLevel?.[2] ?? 0, revenueShareWei: (mockTree as MockFlowTreeData | undefined)?.revenueShareByLevelWei?.[2], treeSlugsAtLevel: (mockTree as MockFlowTreeData | undefined)?.treeSlugsWhereOwnerAtLevel?.[2] ?? [] },
          { level: 4, sharePct: LEVEL_SHARES_L1_TO_L5[3], wallet: (tree as { upline: string[] }).upline[3] ?? '', isYou: false, treesAtLevel: (mockTree as MockFlowTreeData | undefined)?.treesWhereOwnerAtLevel?.[3] ?? 0, revenueShareWei: (mockTree as MockFlowTreeData | undefined)?.revenueShareByLevelWei?.[3], treeSlugsAtLevel: (mockTree as MockFlowTreeData | undefined)?.treeSlugsWhereOwnerAtLevel?.[3] ?? [] },
          { level: 5, sharePct: LEVEL_SHARES_L1_TO_L5[4], wallet: (tree as { upline: string[] }).upline[4] ?? '', isYou: false, treesAtLevel: (mockTree as MockFlowTreeData | undefined)?.treesWhereOwnerAtLevel?.[4] ?? 0, revenueShareWei: (mockTree as MockFlowTreeData | undefined)?.revenueShareByLevelWei?.[4], treeSlugsAtLevel: (mockTree as MockFlowTreeData | undefined)?.treeSlugsWhereOwnerAtLevel?.[4] ?? [] },
        ]
      : [];

  const treeIdLabel = isDemo && walletAddress ? (DEMO_LABELS[walletAddress] ?? walletAddress) : (walletAddress ? formatAddr(walletAddress) : '—');

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
          Connect your wallet or open a demo flow (e.g. /revenue-tree/flow/A).
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
                You (L1 — 2%)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                When you spend, your tree is used: you get 2%, L2–L5 get their share
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

          {/* Table: Level | Tree ID | Share / Wallet | Trees (you at this level) | Share in KAS */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
            <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 gap-y-0 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <div>Level</div>
              <div>Tree ID</div>
              <div>Share / Wallet</div>
              <div title="Number of active trees where your wallet appears at this level; you earn this level's share from their payments." className="cursor-help border-b border-dotted border-zinc-400">
                Trees (you at this level)
              </div>
              <div>Share in {symbol}</div>
            </div>
            {rowsTopToBottom.map((row) => (
              <button
                type="button"
                key={row.level}
                onClick={() => setModalRow(row)}
                className={`w-full grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 gap-y-0 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 items-center text-left cursor-pointer hover:bg-[#02abb8]/5 dark:hover:bg-[#02abb8]/10 transition-colors ${row.isYou ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''}`}
              >
                <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#02abb8]/20 text-[#02abb8] font-black text-sm">
                  {row.level}
                </div>
                <div className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                  {treeIdLabel}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 dark:text-white">{row.sharePct}%</div>
                  <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate" title={row.wallet}>
                    {row.wallet ? walletDisplay(row.wallet, isDemo) : '—'}
                  </div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                  {row.treesAtLevel > 0 ? row.treesAtLevel : '—'}
                </div>
                <div className="text-sm font-semibold text-[#02abb8] tabular-nums">
                  {row.revenueShareWei
                    ? `${parseFloat(formatEther(BigInt(row.revenueShareWei))).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
                    : '—'}
                </div>
              </button>
            ))}
          </div>

          <RevenueTreeFlowLevelModal
            isOpen={!!modalRow}
            onClose={() => setModalRow(null)}
            row={modalRow ? { level: modalRow.level, sharePct: modalRow.sharePct, wallet: modalRow.wallet, isYou: modalRow.isYou, treesAtLevel: modalRow.treesAtLevel, revenueShareWei: modalRow.revenueShareWei, treeSlugsAtLevel: modalRow.treeSlugsAtLevel } : null}
            treeIdLabel={treeIdLabel}
            symbol={symbol}
            walletDisplay={(addr) => walletDisplay(addr, isDemo)}
          />

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            When you spend, your tree is used: you (L1) get 2%, L2–L5 get 5–45% (or Genesis if empty). When someone pays through your referral link, you are L2 in their tree and get 5%; the same continues up the chain.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Demo flow (A → B → C → …):</span>
            {(['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6'] as const).map((slug) => (
              <Link
                key={slug}
                href={`/revenue-tree/flow/${slug}`}
                className={`text-sm font-medium px-2 py-1 rounded ${walletAddress === slug ? 'bg-[#02abb8]/20 text-[#02abb8]' : 'text-violet-600 dark:text-violet-400 hover:underline'}`}
              >
                {DEMO_LABELS[slug] ?? slug}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
