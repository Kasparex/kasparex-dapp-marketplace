'use client';

import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { DonationLeaderboard } from './DonationLeaderboard';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateDonationRevenueTree } from '@/lib/revenue-tree/mockData';
import type { DonationCampaign } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { useDonationPoints } from '@/hooks/useDonationPoints';

interface DonationCampaignRightColumnProps {
  campaign: DonationCampaign;
  creatorAddress: string;
  /** Current L2 donation amount for Revenue Tree share preview (default 10). */
  previewDonationAmount?: number;
}

export function DonationCampaignRightColumn({ campaign, creatorAddress, previewDonationAmount = 10 }: DonationCampaignRightColumnProps) {
  const chainId = useChainId();
  const { address: userWalletAddress } = useAccount();
  const deadlineDate = new Date(Number(campaign.deadline) * 1000);
  const progress = progressPercent(campaign, campaign.targetWei);
  const raisedTotal = totalRaisedWei(campaign);
  const donorsTotal = totalDonorCount(campaign);
  const { points, isLoading: pointsLoading } = useDonationPoints(creatorAddress, userWalletAddress ?? null);

  const revenueTreeData = generateDonationRevenueTree(
    creatorAddress,
    userWalletAddress ?? undefined,
    chainId ?? 38833,
    campaign.active
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Campaign summary */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Campaign summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Raised</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(raisedTotal)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Donors</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{donorsTotal.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Ends</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{deadlineDate.toLocaleDateString()}</span>
          </div>
        </dl>
        <div className="mt-3 w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {userWalletAddress && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Your points</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {pointsLoading ? 'Calculating…' : `${points} points`}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Points are based on your on-chain donations (L2 escrow + recorded L1 donations).
          </p>
        </div>
      )}

      <DonationLeaderboard creatorAddress={creatorAddress} limit={20} donorCount={donorsTotal} raisedWei={raisedTotal} />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden p-4">
        <RevenueTree
          data={revenueTreeData}
          userWalletAddress={userWalletAddress ?? undefined}
          isL2Only={true}
          activationAmount={0}
          amountSpent={previewDonationAmount > 0 ? previewDonationAmount : 10}
          treeBps={1000}
        />
      </div>
    </div>
  );
}
