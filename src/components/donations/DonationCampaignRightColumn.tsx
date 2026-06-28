'use client';

import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { DonationLeaderboard } from './DonationLeaderboard';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateDonationRevenueTree } from '@/lib/revenue-tree/mockData';
import type { DonationCampaign } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { useDonationPoints } from '@/hooks/useDonationPoints';
import { DonationL1TipJar } from '@/components/donations/DonationL1TipJar';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { DonationBlock } from '@/components/donations/DonationBlock';
import { CampaignEndCountdown } from '@/components/donations/CampaignEndCountdown';

interface DonationCampaignRightColumnProps {
  campaign: DonationCampaign;
  creatorAddress: string;
  /** Current L2 donation amount for Revenue Tree share preview (default 10). */
  previewDonationAmount?: number;
  metadata?: DonationCampaignMetadata | null;
  onL2DonationConfirmed?: () => void;
  onL2AmountChange?: (amount: number) => void;
}

export function DonationCampaignRightColumn({
  campaign,
  creatorAddress,
  previewDonationAmount = 10,
  metadata = null,
  onL2DonationConfirmed,
  onL2AmountChange,
}: DonationCampaignRightColumnProps) {
  const chainId = useChainId();
  const { address: userWalletAddress } = useAccount();
  const v2Campaign = campaign.campaignIdV2 != null;
  const progress = progressPercent(campaign, campaign.targetWei, { escrowOnly: v2Campaign });
  const raisedTotal = v2Campaign ? campaign.raisedWei : totalRaisedWei(campaign);
  const donorsTotal = v2Campaign ? campaign.donorCount : totalDonorCount(campaign);
  const l1TipsWei = v2Campaign ? (campaign.l1RecordedTotalWei ?? 0n) : 0n;
  const { points, isLoading: pointsLoading } = useDonationPoints(creatorAddress, userWalletAddress ?? null, {
    campaignId: campaign.campaignIdV2,
  });

  const revenueTreeData = generateDonationRevenueTree(
    creatorAddress,
    userWalletAddress ?? undefined,
    chainId ?? 38833,
    campaign.active
  );

  return (
    <div className="flex flex-col gap-6">
      <DonationBlock
        campaign={campaign}
        layoutVariant="panel"
        onL2DonationConfirmed={onL2DonationConfirmed}
        onL2AmountChange={onL2AmountChange}
      />

      {/* Campaign summary */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Campaign summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{v2Campaign ? 'Raised (L2 goal)' : 'Raised'}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(raisedTotal)} iKAS</span>
          </div>
          {v2Campaign && l1TipsWei > 0n && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">L1 tips (extra)</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatEther(l1TipsWei)} iKAS</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Donors</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{donorsTotal.toString()}</span>
          </div>
        </dl>
        <div className="mt-3 w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <CampaignEndCountdown
            deadlineSec={campaign.deadline}
            compact
            showTimeProgressBar
            timeProgressFillClassName="bg-sky-500 dark:bg-sky-400"
          />
        </div>
      </div>

      {userWalletAddress && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Your points</h3>
          <p className="kx-body">
            {pointsLoading ? 'Calculating…' : `${points} points`}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Points are based on your on-chain donations (L2 escrow + recorded L1 donations).
          </p>
        </div>
      )}

      <DonationL1TipJar
        campaign={campaign}
        metadata={metadata}
        l1TipsModuleUnlocked={Boolean(campaign.modulesUnlocked?.l1Tips)}
        onTipRecorded={onL2DonationConfirmed}
      />

      <div id="crowdkas-supporters">
        <DonationLeaderboard
          creatorAddress={creatorAddress}
          limit={20}
          donorCount={donorsTotal}
          raisedWei={raisedTotal}
          campaignId={campaign.campaignIdV2}
        />
      </div>

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
