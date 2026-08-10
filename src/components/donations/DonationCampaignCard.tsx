'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { formatEther } from 'viem';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { AuthorInline } from '@/components/ui/AuthorInline';
import {
  VDonateCampaignMedia,
  VDonateCardShell,
  VDonateNetworkBadges,
  VDonatePledgeInline,
  VDonateStatusBadges,
} from '@/components/donations/VDonateCampaignCardChrome';
import { quoteVDonateL1Pledge } from '@/lib/donations/l1PledgePayment';

export function DonationCampaignCard({
  campaign,
  metadata,
  href,
  featured,
  footer,
  showPledge = true,
}: {
  campaign: DonationCampaignListItem;
  metadata: DonationCampaignMetadata | null;
  href?: string;
  featured?: boolean;
  /** Extra actions under the card (studio Edit / Claim). */
  footer?: ReactNode;
  /** Listing cards show inline pledge; studio cards can disable it. */
  showPledge?: boolean;
  /** @deprecated Network/status badges are built-in. Kept for call-site compatibility. */
  badges?: { label: string; variant?: 'neutral' | 'emerald' | 'amber' }[];
}) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [pledgeAmount, setPledgeAmount] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(t);
  }, []);

  const v2Row = campaign.campaignId != null;
  const progress = progressPercent(campaign, campaign.targetWei, { escrowOnly: v2Row });
  const raisedDisplay = v2Row ? campaign.raisedWei : totalRaisedWei(campaign);
  const donorsDisplay = v2Row ? campaign.donorCount : totalDonorCount(campaign);
  const deadline = new Date(Number(campaign.deadline) * 1000);
  const deadlineSec = Number(campaign.deadline);
  const isLive = campaign.active && deadlineSec > nowSec;
  const goalReached = raisedDisplay >= campaign.targetWei;
  const isL1Direct = campaign.donationMethod === 'L1_DIRECT';

  const title =
    metadata?.title?.trim() ||
    `${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;
  const category = metadata?.category?.trim() || null;
  const tags = (metadata?.tags ?? []).slice(0, 3);
  const cardHref =
    href ??
    (campaign.campaignId != null
      ? `/donations/${campaign.creatorAddress}?campaignId=${campaign.campaignId.toString()}`
      : `/donations/${campaign.creatorAddress}`);

  const pledgeNum = parseFloat(pledgeAmount);
  const feeHint =
    isL1Direct && Number.isFinite(pledgeNum) && pledgeNum > 0
      ? `Total ~${quoteVDonateL1Pledge(pledgeNum).totalKas} KAS (includes platform fee)`
      : undefined;

  const pledgeFooter =
    showPledge && isLive ? (
      <VDonatePledgeInline
        amount={pledgeAmount}
        onAmountChange={setPledgeAmount}
        onPledge={() => {
          const q = new URLSearchParams();
          if (campaign.campaignId != null) q.set('campaignId', campaign.campaignId.toString());
          if (pledgeAmount.trim()) q.set('pledge', pledgeAmount.trim());
          const qs = q.toString();
          window.location.href = `${cardHref.split('?')[0]}${qs ? `?${qs}` : ''}`;
        }}
        minKas={isL1Direct ? 1 : undefined}
        feeHint={feeHint}
      />
    ) : null;

  const combinedFooter =
    pledgeFooter || footer ? (
      <div className="space-y-3">
        {pledgeFooter}
        {footer}
      </div>
    ) : undefined;

  return (
    <VDonateCardShell href={cardHref} footer={combinedFooter}>
      <VDonateCampaignMedia imageUrl={metadata?.imageUrl} imageHash={metadata?.imageHash} />
      <div className="p-4 pb-0">
        <div className="flex flex-col gap-2 mb-3">
          <VDonateStatusBadges isLive={isLive} goalReached={goalReached} />
          <VDonateNetworkBadges
            network={isL1Direct ? 'l1' : 'l2'}
            featured={featured ?? campaign.featuredModuleUnlocked}
          />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2 leading-snug">
          {title}
        </h3>
        <AuthorInline
          address={campaign.creatorAddress}
          href={`/u/${encodeURIComponent(campaign.creatorAddress)}`}
          prefix=""
          className="mt-0 mb-3"
        />
        {(category || tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {category ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {category}
              </span>
            ) : null}
            {tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {formatEther(raisedDisplay)} / {formatEther(campaign.targetWei)} iKAS
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="kx-body pb-1">
          {donorsDisplay.toString()} donors · Ends {deadline.toLocaleDateString()}
        </p>
      </div>
    </VDonateCardShell>
  );
}
