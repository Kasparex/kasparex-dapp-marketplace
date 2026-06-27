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
  isL2Only?: boolean;
  activationAmount?: number;
  amountSpent?: number;
  treeBps?: number;
}

export function RevenueTree({
  data,
  userWalletAddress,
  isL2Only = true,
  activationAmount = 0,
  amountSpent = DEFAULT_AMOUNT_SPENT,
  treeBps = DEFAULT_TREE_BPS,
}: RevenueTreeProps) {
  const chainId = useChainId();
  const [showGuide, setShowGuide] = useState(false);

  const isActivated = data.isActive;
  const currencySymbol = getNativeCurrencySymbol(chainId);
  const requiredAmount = 100;
  const progress = Math.min((activationAmount / requiredAmount) * 100, 100);

  const amountToTree = (amountSpent * treeBps) / 10000;
  const getLevelShare = (sharePercentage: number) => (amountToTree * sharePercentage) / 100;

  const sortedLevels = [...data.levels].sort((a, b) => a.level - b.level);

  if (isL2Only === false) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Revenue Tree is only available for L2 (Igra) dApps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Native referral rewards
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">5 dynamic levels</p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="k-control-icon-btn shrink-0"
          aria-label="What is Revenue Tree?"
          title="What is Revenue Tree?"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <RevenueTreeGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {!isActivated && userWalletAddress ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tree activation
            </span>
            <span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {activationAmount.toFixed(2)} / {requiredAmount}{' '}
              <span className="text-zinc-500">{currencySymbol}</span>
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="bg-[#02abb8] h-full transition-all duration-700 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Unlocks global yield once {requiredAmount} {currencySymbol} volume is reached.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {sortedLevels.map((level) => {
          const isCurrentUser = Boolean(
            userWalletAddress &&
              (level.walletAddress.toLowerCase() === userWalletAddress.toLowerCase() ||
                (userWalletAddress.length >= 4 && level.walletAddress.includes(userWalletAddress.slice(-4)))),
          );
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

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total yield
          </span>
          <span className="text-lg font-black text-[#02abb8] tabular-nums">
            {data.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs text-zinc-500 font-bold">{currencySymbol}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Network reach
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {data.revenueTreesCount} referral trees
          </span>
        </div>
      </div>

      <ReferralLinkBox referralLink={data.referralLink} isActive={data.isActive} contentType={data.contentType} />
    </div>
  );
}
