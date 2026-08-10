'use client';

import { crowdkasCardClass } from '@/components/donations/CrowdKasUi';
import { DonationLeaderboard } from './DonationLeaderboard';
import type { DonationCampaign } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { useDonationPoints } from '@/hooks/useDonationPoints';
import { DonationL1TipJar } from '@/components/donations/DonationL1TipJar';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { DonationBlock } from '@/components/donations/DonationBlock';
import { CampaignEndCountdown } from '@/components/donations/CampaignEndCountdown';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';

interface DonationCampaignRightColumnProps {
  campaign: DonationCampaign;
  creatorAddress: string;
  previewDonationAmount?: number;
  metadata?: DonationCampaignMetadata | null;
  onL2DonationConfirmed?: () => void;
  onL2AmountChange?: (amount: number) => void;
}

export function DonationCampaignRightColumn({
  campaign,
  creatorAddress,
  previewDonationAmount: _previewDonationAmount = 10,
  metadata = null,
  onL2DonationConfirmed,
  onL2AmountChange,
}: DonationCampaignRightColumnProps) {
  const { address: userWalletAddress } = useAccount();
  const v2Campaign = campaign.campaignIdV2 != null;
  const progress = progressPercent(campaign, campaign.targetWei, { escrowOnly: v2Campaign });
  const raisedTotal = v2Campaign ? campaign.raisedWei : totalRaisedWei(campaign);
  const donorsTotal = v2Campaign ? campaign.donorCount : totalDonorCount(campaign);
  const l1TipsWei = v2Campaign ? (campaign.l1RecordedTotalWei ?? 0n) : 0n;
  const { points, isLoading: pointsLoading } = useDonationPoints(creatorAddress, userWalletAddress ?? null, {
    campaignId: campaign.campaignIdV2,
  });

  return (
    <HubAsideRail
      adSlotId="HALO_DONATIONS_RIGHT"
      adId="ad-slot-crowdkas-campaign-rail"
      className="gap-6"
    >
      <div className={`${crowdkasCardClass} space-y-4`}>
        <DAppSectionHeader title="Donate" className="mb-0" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">{v2Campaign ? 'Raised (L2 goal)' : 'Raised'}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(raisedTotal)} iKAS</span>
          </div>
          {v2Campaign && l1TipsWei > 0n ? (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">L1 tips (extra)</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatEther(l1TipsWei)} iKAS</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Donors</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{donorsTotal.toString()}</span>
          </div>
        </dl>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <CampaignEndCountdown
          deadlineSec={campaign.deadline}
          compact
          showTimeProgressBar
          timeProgressFillClassName="bg-sky-500 dark:bg-sky-400"
        />
        <DonationBlock
          campaign={campaign}
          layoutVariant="footer"
          onL2DonationConfirmed={onL2DonationConfirmed}
          onL2AmountChange={onL2AmountChange}
        />
      </div>

      {userWalletAddress ? (
        <div className={`${crowdkasCardClass} space-y-2`}>
          <DAppSectionHeader title="Your points" className="mb-0" />
          <p className="kx-body">{pointsLoading ? 'Calculating…' : `${points} points`}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Points are based on your on-chain donations (L2 escrow + recorded L1 donations).
          </p>
        </div>
      ) : null}

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
    </HubAsideRail>
  );
}
