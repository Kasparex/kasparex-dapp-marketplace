'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatEther } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { AuthorInline } from '@/components/ui/AuthorInline';
import {
  VDonateBadgeRow,
  VDonateCampaignMedia,
  VDonateCardShell,
} from '@/components/donations/VDonateCampaignCardChrome';
import { DonationVoteControls } from '@/components/donations/DonationVoteControls';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { evaluateHubAccess, getHubGateMessage } from '@/lib/hub/access';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import { VDONATE_SHORT_NAME } from '@/lib/donations/brand';

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
  footer?: ReactNode;
  showPledge?: boolean;
  badges?: { label: string; variant?: 'neutral' | 'emerald' | 'amber' }[];
}) {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const { state: kaspaState } = useKaspaWallet();
  const { isConnected: evmConnected } = useAccount();
  const chainId = useChainId();
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();

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
  const network: 'l1' | 'l2' = isL1Direct ? 'l1' : 'l2';

  const title =
    metadata?.title?.trim() ||
    `${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;
  const category = metadata?.category?.trim() || null;
  const cardHref =
    href ??
    (campaign.campaignId != null
      ? `/donations/${campaign.creatorAddress}?campaignId=${campaign.campaignId.toString()}`
      : `/donations/${campaign.creatorAddress}`);

  const entityId =
    campaign.campaignId != null
      ? `v2:${campaign.campaignId.toString()}`
      : `v1:${campaign.creatorAddress.toLowerCase()}`;

  const access = useMemo(
    () =>
      evaluateHubAccess({
        requirement: isL1Direct
          ? { layer: 'L1' }
          : { layer: 'L2', chainIds: [CROWDKAS_CHAIN_ID] },
        isKaspaConnected: Boolean(kaspaState.isConnected && kaspaState.address),
        isEvmConnected: evmConnected,
        chainId,
      }),
    [isL1Direct, kaspaState.isConnected, kaspaState.address, evmConnected, chainId],
  );

  const requireWallet = () => {
    if (access.isOpenable) return true;
    promptHubGate(
      { gateReason: access.reason, isOpenable: false },
      {
        title: 'Connect wallet',
        name: title,
        message: getHubGateMessage(access.reason, access.requiredChainNames),
        networkBadge: isL1Direct
          ? { layer: 'L1', label: 'Kaspa' }
          : { layer: 'L2', label: 'Igra Mainnet' },
      },
    );
    return false;
  };

  const listingFooter =
    showPledge || footer ? (
      <div className="space-y-3">
        {showPledge ? (
          <div
            className="flex items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              {category ? (
                <KxListingCategoryChip title={category}>{category}</KxListingCategoryChip>
              ) : (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{VDONATE_SHORT_NAME}</span>
              )}
            </div>
            <DonationVoteControls
              entityId={entityId}
              creatorWallet={isL1Direct ? campaign.l1Address || campaign.creatorAddress : campaign.creatorAddress}
              title={title}
              compact
            />
          </div>
        ) : null}
        {footer ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {footer}
          </div>
        ) : null}
      </div>
    ) : undefined;

  return (
    <>
      <VDonateCardShell href={cardHref} footer={listingFooter} onNavigate={() => requireWallet()}>
        <VDonateCampaignMedia imageUrl={metadata?.imageUrl} imageHash={metadata?.imageHash} />
        <div className="p-4 pb-3 flex flex-1 flex-col">
          <div className="mb-3">
            <VDonateBadgeRow
              network={network}
              isLive={isLive}
              goalReached={goalReached}
              featured={featured ?? campaign.featuredModuleUnlocked}
            />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="mb-3">
            <AuthorInline
              address={campaign.creatorAddress}
              href={`/u/${encodeURIComponent(campaign.creatorAddress)}`}
              prefix=""
              className="mt-0 mb-0 min-w-0"
            />
          </div>
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
      {l1Modal ? (
        <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} />
      ) : null}
    </>
  );
}
