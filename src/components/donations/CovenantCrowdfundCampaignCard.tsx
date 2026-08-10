'use client';

import { useMemo, useState } from 'react';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import {
  covenantCampaignBackerCount,
  covenantCampaignGoalKas,
  covenantCampaignIsActive,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
  covenantCampaignGoalReached,
} from '@/lib/donations/covenantCrowdfund';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { placeholderDApps } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import { quoteVDonateL1Pledge } from '@/lib/donations/l1PledgePayment';
import { sortTiersByMinKas } from '@/lib/donations/tiers';
import {
  VDonateCampaignMedia,
  VDonateCardShell,
  VDonateNetworkBadges,
  VDonatePledgeInline,
  VDonateStatusBadges,
} from '@/components/donations/VDonateCampaignCardChrome';
import { hubNotify } from '@/lib/hub/notify';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;
const PLEDGE_HUB_POINTS_BASE = getHubPointsBaseForAction(CROWDFUND_DAPP, 'pledge');

export function CovenantCrowdfundCampaignCard({
  campaign,
}: {
  campaign: CrowdfundCampaign;
  footer?: React.ReactNode;
}) {
  const { state } = useKaspaWallet();
  const { pledge, refresh } = useCovenantCrowdfund();
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const goalReached = covenantCampaignGoalReached(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const deadline = new Date(campaign.deadline);
  const href = `/donations/covenant/${campaign.id}`;
  const cheapestTier = useMemo(
    () => (campaign.tiers?.length ? sortTiersByMinKas(campaign.tiers)[0] : null),
    [campaign.tiers],
  );

  const pledgeNum = parseFloat(pledgeAmount);
  const feeHint =
    Number.isFinite(pledgeNum) && pledgeNum > 0
      ? `Total ~${quoteVDonateL1Pledge(pledgeNum).totalKas} KAS (pledge + platform fee)`
      : cheapestTier
        ? `From ${cheapestTier.minKas} KAS · ${campaign.tiers!.length} reward tier${campaign.tiers!.length === 1 ? '' : 's'}`
        : undefined;

  const handlePledge = async () => {
    if (!state.isConnected) {
      hubNotify.info('Connect wallet', 'Connect a Kaspa wallet to pledge from the card.');
      window.location.href = href;
      return;
    }
    const amount = parseFloat(pledgeAmount);
    if (!Number.isFinite(amount) || amount < minKas) {
      hubNotify.error('Invalid amount', `Enter at least ${minKas} KAS.`);
      return;
    }
    setBusy(true);
    try {
      await pledge(campaign.id, amount, cheapestTier?.id);
      setPledgeAmount('');
      await refresh();
      hubNotify.success('Pledge locked', 'Your L1 covenant pledge is on Kaspa.');
    } catch {
      /* hook toasts */
    } finally {
      setBusy(false);
    }
  };

  return (
    <VDonateCardShell
      href={href}
      footer={
        isLive ? (
          <VDonatePledgeInline
            amount={pledgeAmount}
            onAmountChange={setPledgeAmount}
            onPledge={() => void handlePledge()}
            busy={busy}
            minKas={minKas}
            feeHint={feeHint}
          />
        ) : undefined
      }
    >
      <VDonateCampaignMedia imageUrl={campaign.imageUrl} imageHash={campaign.imageHash} />
      <div className="p-4 pb-0">
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <VDonateStatusBadges isLive={isLive} goalReached={goalReached} />
            {isLive && PLEDGE_HUB_POINTS_BASE > 0 ? (
              <HubPointsEarnBadge
                basePoints={PLEDGE_HUB_POINTS_BASE}
                tier="Tier0"
                showMinSpendTooltip={false}
                size="sm"
              />
            ) : null}
          </div>
          <VDonateNetworkBadges network="l1" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2 leading-snug">
          {campaign.title}
        </h3>
        <AuthorInline
          address={campaign.creator}
          href={`/u/${encodeURIComponent(campaign.creator)}`}
          prefix=""
          className="mt-0 mb-3"
        />
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {raised.toFixed(4)} / {goal.toFixed(4)} KAS
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="kx-body pb-1">
          {backers} backer{backers === 1 ? '' : 's'} · Ends {deadline.toLocaleDateString()}
        </p>
      </div>
    </VDonateCardShell>
  );
}
