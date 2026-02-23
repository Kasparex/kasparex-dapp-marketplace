'use client';

import { formatEther } from 'viem';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';
import type { MockFlowTreeData } from '@/lib/revenue-tree/mockFlowData';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';

const L1_SHARE_PCT = REVENUE_SHARE_PERCENTAGES.LEVEL_01; // 2% — you when you spend
/** When your referrals spend, you are L2 in their tree and receive this share. */
const REFERRAL_SHARE_PCT = REVENUE_SHARE_PERCENTAGES.LEVEL_02; // 5%

function isMockTree(tree: UnifiedRevenueTreeData | MockFlowTreeData | null): tree is MockFlowTreeData {
  return tree !== null && 'treesWhereOwnerAtLevel' in tree;
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tree data. Connect wallet or open demo.</p>
      </div>
    );
  }

  const lifetimeWei = 'lifetimeVolume' in tree ? BigInt(tree.lifetimeVolume) : BigInt(0);
  const lifetimeNum = parseFloat(formatEther(lifetimeWei));

  const totalReferred = isMockTree(tree) && 'treesWhereOwnerAtLevel' in tree
    ? tree.treesWhereOwnerAtLevel[1]
    : null;

  const totalTreeVolumeWei = isMockTree(tree) && tree.totalTreeVolume
    ? BigInt(tree.totalTreeVolume)
    : null;
  const totalTreeVolumeNum = totalTreeVolumeWei !== null ? parseFloat(formatEther(totalTreeVolumeWei)) : null;
  const downlineVolumeNum = totalTreeVolumeNum != null && totalTreeVolumeNum > lifetimeNum ? totalTreeVolumeNum - lifetimeNum : 0;
  const yourShareFromYourSpend = (L1_SHARE_PCT / 100) * lifetimeNum;
  const estimatedReferralShare = (REFERRAL_SHARE_PCT / 100) * downlineVolumeNum;

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
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Referred in tree</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {totalReferred !== null ? totalReferred : '—'}
            </div>
            {totalReferred === null && (
              <div className="text-xs text-zinc-400 dark:text-zinc-500">N/A on-chain (V1)</div>
            )}
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              {totalTreeVolumeNum !== null ? 'Tree total spent' : 'Your volume'}
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

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Your share (L1: {L1_SHARE_PCT}%)</div>
            <div className="text-lg font-bold text-[#02abb8]">
              {yourShareFromYourSpend.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Your spend uses this tree; you get {L1_SHARE_PCT}%.</p>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">From referrals (L2: {REFERRAL_SHARE_PCT}%)</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {estimatedReferralShare > 0
                ? `${estimatedReferralShare.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`
                : `— ${symbol}`}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Referrals put you at L2; you get {REFERRAL_SHARE_PCT}% of their spend.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
