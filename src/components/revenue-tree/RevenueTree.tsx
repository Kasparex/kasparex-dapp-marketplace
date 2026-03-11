'use client';

import { useState } from 'react';
import { RevenueTreeData } from '@/lib/revenue-tree/types';
import { RevenueTreeLevel } from './RevenueTreeLevel';
import { ReferralLinkBox } from './ReferralLinkBox';
import { RevenueTreeGuideModal } from './RevenueTreeGuideModal';
import { useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

const DEFAULT_AMOUNT_SPENT = 10;
const DEFAULT_TREE_BPS = 1000;

interface RevenueTreeProps {
  data: RevenueTreeData;
  userWalletAddress?: string;
  isL2Only?: boolean; // Only show for L2 dApps
  activationAmount?: number; // Amount spent toward activation (default: 100 KAS)
  /** Amount spent in native token (e.g. payment amount); used to show per-level split. Updates when user changes price. */
  amountSpent?: number;
  /** Revenue tree share in BPS (10000 = 100%). Default 1000 = 10%. */
  treeBps?: number;
}

export function RevenueTree({ data, userWalletAddress, isL2Only = true, activationAmount = 0, amountSpent = DEFAULT_AMOUNT_SPENT, treeBps = DEFAULT_TREE_BPS }: RevenueTreeProps) {
  const chainId = useChainId();
  const [showGuide, setShowGuide] = useState(false);

  // Unified tree (on-chain): use data.isActive directly from the transformed object
  const isActivated = data.isActive;

  const currencySymbol = getNativeCurrencySymbol(chainId);
  const requiredAmount = 100;
  const progress = Math.min((activationAmount / requiredAmount) * 100, 100);

  const amountToTree = (amountSpent * treeBps) / 10000;
  const getLevelShare = (sharePercentage: number) => (amountToTree * sharePercentage) / 100;

  // Sort levels from 5 to 1 (top to bottom)
  const sortedLevels = [...data.levels].sort((a, b) => b.level - a.level);

  // Don't show if L1 dApp
  if (isL2Only === false) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Revenue Tree is only available for L2 (IGRA) dApps
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with info button */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
            Revenue Tree
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">
            Native Distribution • 5 Structural Levels
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-[#02abb8] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="What is Revenue Tree?"
          title="What is Revenue Tree?"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <RevenueTreeGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Progress Bar - Show if not activated */}
      {!isActivated && userWalletAddress && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#02abb8] pulse" />
              <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Activation Status
              </span>
            </div>
            <span className="text-[10px] font-black text-zinc-900 dark:text-white font-mono">
              {activationAmount.toFixed(2)} / {requiredAmount} <span className="text-zinc-400">{currencySymbol}</span>
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div
              className="bg-gradient-to-r from-[#02abb8] to-emerald-500 h-full transition-all duration-700 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-500 mt-2 uppercase tracking-tight">
            Requires {requiredAmount} {currencySymbol} lifetime volume to unlock.
          </p>
        </div>
      )}

      {/* Levels (with per-level iKAS split inside each capsule) */}
      <div className="space-y-3">
        {sortedLevels.map((level) => {
          const isCurrentUser = Boolean(userWalletAddress &&
            (level.walletAddress.toLowerCase() === userWalletAddress.toLowerCase() ||
              (userWalletAddress.length >= 4 && level.walletAddress.includes(userWalletAddress.slice(-4)))));
          const levelShareIkas = getLevelShare(level.sharePercentage);
          return (
            <RevenueTreeLevel
              key={level.level}
              level={level}
              isCurrentUser={isCurrentUser}
              contentType={data.contentType}
              contentSlug={data.contentSlug}
              levelShareIkas={levelShareIkas}
              currencySymbol={currencySymbol}
            />
          );
        })}
      </div>

      {/* Total Earned Section */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Total Yield:
          </div>
          <div className="text-xl font-black text-[#02abb8] tabular-nums">
            {data.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-bold uppercase">{currencySymbol}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Active Deployments:
          </div>
          <div className="text-xs font-black text-zinc-900 dark:text-zinc-100">
            {data.revenueTreesCount} Structural
          </div>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="pt-4">
        <ReferralLinkBox
          referralLink={data.referralLink}
          isActive={data.isActive}
          contentType={data.contentType}
        />
      </div>
    </div>
  );
}
