'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { getGatewayUrl } from '@/lib/ipfs/gateway';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholder } from '@/components/kx/KxListingCardPlaceholder';

export function DonationCampaignCard({
  campaign,
  metadata,
  href,
  badges,
}: {
  campaign: DonationCampaignListItem;
  metadata: DonationCampaignMetadata | null;
  href?: string;
  badges?: { label: string; variant?: 'neutral' | 'emerald' | 'amber' }[];
}) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

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

  const imageSrc =
    metadata?.imageUrl?.trim() || (metadata?.imageHash ? getGatewayUrl(metadata.imageHash) : null);
  const title = metadata?.title?.trim() || `${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;
  const category = metadata?.category?.trim() || null;
  const tags = (metadata?.tags ?? []).slice(0, 3);

  return (
    <KxListingCard href={href ?? `/donations/${campaign.creatorAddress}`} accent="crowdkas">
      <KxListingCardMedia>
        {imageSrc ? (
          <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <KxListingCardPlaceholder />
        )}
      </KxListingCardMedia>
      <KxListingCardBody>
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
            {campaign.creatorAddress.slice(0, 6)}...{campaign.creatorAddress.slice(-4)}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
            {(badges ?? []).map((b) => (
              <span
                key={b.label}
                className={
                  b.variant === 'emerald'
                    ? 'text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : b.variant === 'amber'
                      ? 'text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                      : 'text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }
              >
                {b.label}
              </span>
            ))}
            {goalReached ? (
              <span className="text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 font-medium">
                Goal reached
              </span>
            ) : null}
            {isLive ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                Active
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-400 dark:bg-zinc-500 text-white dark:text-zinc-950 font-medium">
                Ended
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">{title}</p>
        {(category || tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {category && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {category}
              </span>
            )}
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
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {donorsDisplay.toString()} donors · Ends {deadline.toLocaleDateString()}
        </p>
      </KxListingCardBody>
    </KxListingCard>
  );
}
