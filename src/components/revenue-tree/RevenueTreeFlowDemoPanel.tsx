'use client';

import { formatEther } from 'viem';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';

const OWNER_SHARE_PCT = REVENUE_SHARE_PERCENTAGES.LEVEL_01; // 2%

function isMockTree(tree: UnifiedRevenueTreeData | MockFlowTreeData | null): tree is MockFlowTreeData {
  return tree !== null && 'userCounts' in tree;
}

export interface RevenueTreeFlowDemoPanelProps {
  /** Unified (live) or mock tree, or null when loading/unsupported. */
  tree: UnifiedRevenueTreeData | MockFlowTreeData | null;
  /** Native currency symbol (e.g. KAS, iKAS). */
  symbol: string;
}

export function RevenueTreeFlowDemoPanel({ tree, symbol }: RevenueTreeFlowDemoPanelProps) {
  if (!tree) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Demo calculations
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tree data — connect a wallet or open a demo flow.</p>
      </div>
    );
  }

  const lifetimeWei = 'lifetimeVolume' in tree ? BigInt(tree.lifetimeVolume) : BigInt(0);
  const lifetimeNum = parseFloat(formatEther(lifetimeWei));
  const potentialShare = (OWNER_SHARE_PCT / 100) * lifetimeNum;

  const totalReferred = isMockTree(tree)
    ? Math.max(0, tree.userCounts.reduce((a, b) => a + b, 0) - 1)
    : null;

  const totalTreeVolumeWei = isMockTree(tree) && tree.totalTreeVolume
    ? BigInt(tree.totalTreeVolume)
    : null;
  const totalTreeVolumeNum = totalTreeVolumeWei !== null ? parseFloat(formatEther(totalTreeVolumeWei)) : null;

  const volumePerLevel = isMockTree(tree) && tree.volumePerLevel
    ? tree.volumePerLevel.map((v) => parseFloat(formatEther(BigInt(v))))
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Demo calculations
        </div>
        <div className="space-y-4 text-sm">
          {/* Total referred users */}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Total referred users in tree</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {totalReferred !== null ? totalReferred : '—'}
            </div>
            {totalReferred === null && (
              <div className="text-xs text-zinc-400 dark:text-zinc-500">Not available on-chain (V1)</div>
            )}
          </div>

          {/* Total KAS: tree and/or root */}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              {totalTreeVolumeNum !== null ? 'Total KAS spent by tree' : 'Your volume (L1)'}
            </div>
            <div className="text-lg font-bold text-[#02abb8]">
              {totalTreeVolumeNum !== null
                ? `${totalTreeVolumeNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
                : `${lifetimeNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`}
            </div>
          </div>

          {/* Per-level volume (optional) */}
          {volumePerLevel && volumePerLevel.some((v) => v > 0) && (
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total KAS per level</div>
              <ul className="space-y-0.5 text-xs">
                {volumePerLevel.map((vol, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">L{i + 1}</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {vol.toLocaleString(undefined, { maximumFractionDigits: 0 })} {symbol}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Potential revenue share for wallet owner (2% of L1 volume) */}
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              Your share ({OWNER_SHARE_PCT}% of your volume)
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {potentialShare.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              L1 earns {OWNER_SHARE_PCT}% of payments attributed to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
