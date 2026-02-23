'use client';

import Link from 'next/link';
import { DEMO_LABELS } from '@/lib/revenue-tree/mockFlowData';
import { formatEther } from 'viem';

export interface RevenueTreeFlowLevelModalRow {
  level: number;
  sharePct: number;
  wallet: string;
  isYou: boolean;
  treesAtLevel: number;
  revenueShareWei?: string;
  treeSlugsAtLevel: string[];
}

export interface RevenueTreeFlowLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: RevenueTreeFlowLevelModalRow | null;
  treeIdLabel: string;
  symbol: string;
  walletDisplay: (addr: string) => string;
}

export function RevenueTreeFlowLevelModal({
  isOpen,
  onClose,
  row,
  treeIdLabel,
  symbol,
  walletDisplay,
}: RevenueTreeFlowLevelModalProps) {
  if (!isOpen || !row) return null;

  const shareInKas = row.revenueShareWei
    ? parseFloat(formatEther(BigInt(row.revenueShareWei))).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Level {row.level} · {row.sharePct}% share
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-sm">
            <ul className="space-y-1 text-zinc-700 dark:text-zinc-300">
              <li><span className="text-zinc-500 dark:text-zinc-400">Level:</span> {row.level} · <span className="text-zinc-500 dark:text-zinc-400">Share:</span> {row.sharePct}%</li>
              <li><span className="text-zinc-500 dark:text-zinc-400">Wallet:</span> <span className="font-mono">{walletDisplay(row.wallet)}</span></li>
              <li><span className="text-zinc-500 dark:text-zinc-400">Share in {symbol}:</span> {shareInKas} {symbol} · <span className="text-zinc-500 dark:text-zinc-400">Trees:</span> {row.treesAtLevel}</li>
            </ul>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {row.level === 1
              ? 'Your tree. When you spend, you get this share.'
              : `You’re at L${row.level} in the trees below; you get ${row.sharePct}% when they spend.`}
          </p>

          {row.treeSlugsAtLevel.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Trees where you’re at L{row.level}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                Open a tree to view its flow.
              </p>
              <ul className="space-y-1">
                {row.treeSlugsAtLevel.map((slug) => (
                  <li key={slug}>
                    <Link
                      href={`/revenue-tree/flow/${slug}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#02abb8]/10 dark:bg-[#02abb8]/20 border border-[#02abb8]/20 text-[#02abb8] font-medium text-sm hover:bg-[#02abb8]/20 dark:hover:bg-[#02abb8]/30 transition-colors"
                      onClick={onClose}
                    >
                      Tree {DEMO_LABELS[slug] ?? slug} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {row.treeSlugsAtLevel.length === 0 && row.treesAtLevel === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No trees with you at this level.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
