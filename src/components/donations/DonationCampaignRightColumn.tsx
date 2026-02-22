'use client';

import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { DonationLeaderboard } from './DonationLeaderboard';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateDonationRevenueTree } from '@/lib/revenue-tree/mockData';
import type { DonationCampaign } from '@/lib/donations/types';

interface DonationCampaignRightColumnProps {
  campaign: DonationCampaign;
  creatorAddress: string;
}

export function DonationCampaignRightColumn({ campaign, creatorAddress }: DonationCampaignRightColumnProps) {
  const chainId = useChainId();
  const { address: userWalletAddress } = useAccount();
  const deadlineDate = new Date(Number(campaign.deadline) * 1000);
  const progress = campaign.targetWei > 0n ? Number((campaign.raisedWei * 10000n) / campaign.targetWei) / 100 : 0;

  const revenueTreeData = generateDonationRevenueTree(
    creatorAddress,
    userWalletAddress ?? undefined,
    chainId ?? 38836,
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
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(campaign.raisedWei)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Donors</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{campaign.donorCount.toString()}</span>
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

      <DonationLeaderboard creatorAddress={creatorAddress} limit={20} />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <RevenueTree
          data={revenueTreeData}
          userWalletAddress={userWalletAddress ?? undefined}
          isL2Only={true}
          activationAmount={0}
          amountSpent={10}
        />
      </div>
    </div>
  );
}
