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

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

function InfoModal({ isOpen, onClose, title, content }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {content}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function InfoIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center justify-center w-4 h-4 ml-1.5 text-zinc-400 hover:text-[#02abb8] bg-zinc-100 hover:bg-[#02abb8]/10 dark:bg-zinc-800 dark:hover:bg-[#02abb8]/20 rounded-full transition-colors"
      title="More information"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

export function RevenueTreeFlowView({ walletAddress, tree: treeProp, embedded = false }: RevenueTreeFlowViewProps) {
  const { address: connectedAddress } = useAccount();
  const isDemo = isDemoWalletSlug(walletAddress);
  const mockTree = isDemo ? getMockFlowTree(walletAddress) : null;
  const [activeModal, setActiveModal] = useState<string | null>(null);
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
    treeProp === undefined && !isDemo && walletAddress.startsWith('0x') ? { address: walletAddress as `0x${string}` } : {}
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

  const lifetimeFormatted = tree && 'lifetimeVolume' in tree ? formatEther(BigInt((tree as { lifetimeVolume: string }).lifetimeVolume)) : '0';
  const volume30Formatted = tree && 'volumeLast30Days' in tree ? formatEther(BigInt((tree as { volumeLast30Days: string }).volumeLast30Days)) : '0';

  const wrapperClass = embedded ? 'w-full min-w-0 p-4 sm:p-6 lg:p-8' : 'w-full min-w-0';

  if (!isDemo && !connectedAddress && !walletAddress.startsWith('0x')) {
    return (
      <div className={wrapperClass}>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
          Connect wallet or open a demo (e.g. flow/A).
        </div>
      </div>
    );
  }

  if (!isDemo && !tree && (treeProp !== undefined || (!isSupported && !isLoading && !liveTree))) {
    return (
      <div className={wrapperClass}>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 text-sm">
          No tree on this network or for this wallet.
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
          ← Dashboard
        </Link>
        {connectedAddress && walletAddress.startsWith('0x') && connectedAddress.toLowerCase() === walletAddress.toLowerCase() && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">(Your tree)</span>
        )}
      </div>

      {!isDemo && treeProp === undefined && isLoading && !liveTree && (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
          Loading…
        </div>
      )}

      {rowsTopToBottom.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                L1 (Direct Referrer)
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white truncate" title={tree && 'upline' in tree ? tree.upline[0] : '—'}>
                {tree && 'upline' in tree ? walletDisplay(tree.upline[0], isDemo) : '—'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Your L1 never earns from your spend; L2–L5 gets pushed up.
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Tree ID
              </div>
              <div className="text-lg font-bold font-mono text-zinc-900 dark:text-white truncate" title={walletAddress}>
                {treeIdLabel}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Lifetime vol.
              </div>
              <div className="text-lg font-bold text-[#02abb8]">
                {lifetimeFormatted} {symbol}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                30d vol.
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {volume30Formatted} {symbol}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden relative">
            <InfoModal
              isOpen={activeModal === 'level'}
              onClose={() => setActiveModal(null)}
              title="Level"
              content="The level of separation between you and the referenced upline user."
            />
            <InfoModal
              isOpen={activeModal === 'share'}
              onClose={() => setActiveModal(null)}
              title="Share %"
              content="The precise percentage of your dApp spending volume that gets pushed up to this specific level."
            />
            <InfoModal
              isOpen={activeModal === 'wallet'}
              onClose={() => setActiveModal(null)}
              title="Wallet (Referrer)"
              content="The address of the user positioned at this level in your upline. Inactive or empty positions automatically route to Genesis."
            />
            <InfoModal
              isOpen={activeModal === 'active'}
              onClose={() => setActiveModal(null)}
              title="Active Downline"
              content="The number of active Revenue Trees where you are positioned precisely at this depth."
            />
            <InfoModal
              isOpen={activeModal === 'network'}
              onClose={() => setActiveModal(null)}
              title="Network Share"
              content="Your cumulative earnings generated by users residing at this depth in your network."
            />

            <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
                    <th className="pb-3 font-medium">
                      <div className="flex items-center">
                        Level <InfoIcon onClick={() => setActiveModal('level')} />
                      </div>
                    </th>
                    <th className="pb-3 font-medium">
                      <div className="flex items-center">
                        Share % <InfoIcon onClick={() => setActiveModal('share')} />
                      </div>
                    </th>
                    <th className="pb-3 font-medium">
                      <div className="flex items-center">
                        Wallet (Referrer) <InfoIcon onClick={() => setActiveModal('wallet')} />
                      </div>
                    </th>
                    <th className="pb-3 font-medium w-36">
                      <div className="flex items-center">
                        Active Downline <InfoIcon onClick={() => setActiveModal('active')} />
                      </div>
                    </th>
                    <th className="pb-3 font-medium text-right">
                      <div className="flex items-center justify-end">
                        Network Share <InfoIcon onClick={() => setActiveModal('network')} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rowsTopToBottom.map((row) => {
                    const isActiveNode = tree && 'isActiveAtLevel' in tree && tree.isActiveAtLevel[row.level - 1];
                    const isRealWallet = row.wallet && row.wallet !== '0x0000000000000000000000000000000000000000';
                    const receives = isActiveNode && isRealWallet;

                    return (
                      <tr
                        key={row.level}
                        className="text-sm cursor-pointer hover:bg-[#02abb8]/5 dark:hover:bg-[#02abb8]/10 transition-colors"
                        onClick={() => setModalRow(row)}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs bg-[#02abb8]/10 text-[#02abb8]">
                              L{row.level}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.sharePct}%
                        </td>
                        <td className="py-4 font-mono text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span className={`truncate ${!receives ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`} title={row.wallet}>
                              {row.wallet ? walletDisplay(row.wallet, isDemo) : '—'}
                            </span>
                            {!receives && <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 shrink-0">Genesis</span>}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                            {row.treesAtLevel > 0 ? row.treesAtLevel.toLocaleString() : '—'}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className={`font-bold tabular-nums ${!receives ? 'text-zinc-400' : 'text-[#02abb8]'}`}>
                            {row.revenueShareWei
                              ? `${parseFloat(formatEther(BigInt(row.revenueShareWei))).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
                              : '—'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            Inactive levels automatically route to the Kasparex Genesis Treasury.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Demo:</span>
            {(['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6'] as const).map((slug) => (
              <Link
                key={slug}
                href={`/tree/flow/${slug}`}
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
