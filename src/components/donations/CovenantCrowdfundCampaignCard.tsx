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
import { sortTiersByMinKas } from '@/lib/donations/tiers';
import {
  VDonateBadgeRow,
  VDonateCampaignMedia,
  VDonateCardShell,
  VDonatePledgeInline,
} from '@/components/donations/VDonateCampaignCardChrome';
import { DonationVoteControls } from '@/components/donations/DonationVoteControls';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { evaluateHubAccess, getHubGateMessage } from '@/lib/hub/access';
import { hubNotify } from '@/lib/hub/notify';
import { VDONATE_SHORT_NAME } from '@/lib/donations/brand';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;
const PLEDGE_HUB_POINTS_BASE = getHubPointsBaseForAction(CROWDFUND_DAPP, 'pledge');

export function CovenantCrowdfundCampaignCard({
  campaign,
  footer,
  showPledge = true,
}: {
  campaign: CrowdfundCampaign;
  footer?: React.ReactNode;
  /** Listing cards: true. My Campaigns / studio: false (actions only). */
  showPledge?: boolean;
}) {
  const { state } = useKaspaWallet();
  const { pledge, refresh } = useCovenantCrowdfund();
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();

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

  const access = useMemo(
    () =>
      evaluateHubAccess({
        requirement: { layer: 'L1' },
        isKaspaConnected: Boolean(state.isConnected && state.address),
        isEvmConnected: false,
      }),
    [state.isConnected, state.address],
  );

  const requireWallet = () => {
    if (access.isOpenable) return true;
    promptHubGate(
      { gateReason: access.reason, isOpenable: false },
      {
        title: 'Connect Kaspa wallet',
        name: campaign.title,
        message: getHubGateMessage(access.reason, access.requiredChainNames),
        networkBadge: { layer: 'L1', label: 'Kaspa' },
      },
    );
    return false;
  };

  const pledgeNum = parseFloat(pledgeAmount);
  void pledgeNum;

  const handlePledge = async () => {
    if (!requireWallet()) return;
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
    } catch {
      /* hook toasts */
    } finally {
      setBusy(false);
    }
  };

  const listingFooter = (
    <div className="space-y-3">
      {showPledge && isLive ? (
        <VDonatePledgeInline
          amount={pledgeAmount}
          onAmountChange={setPledgeAmount}
          onPledge={() => void handlePledge()}
          busy={busy}
          minKas={minKas}
        />
      ) : null}
      {showPledge ? (
        <div
          className="flex items-center justify-between gap-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            {campaign.category ? (
              <KxListingCategoryChip title={campaign.category}>{campaign.category}</KxListingCategoryChip>
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{VDONATE_SHORT_NAME} L1</span>
            )}
          </div>
          <DonationVoteControls
            entityId={`covenant:${campaign.id}`}
            creatorWallet={campaign.creator}
            title={campaign.title}
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
  );

  return (
    <>
      <VDonateCardShell href={href} footer={listingFooter} onNavigate={() => requireWallet()}>
        <VDonateCampaignMedia imageUrl={campaign.imageUrl} imageHash={campaign.imageHash} />
        <div className="p-4 pb-3 flex flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between gap-2">
            <VDonateBadgeRow network="l1" isLive={isLive} goalReached={goalReached} />
            {isLive && PLEDGE_HUB_POINTS_BASE > 0 ? (
              <HubPointsEarnBadge
                basePoints={PLEDGE_HUB_POINTS_BASE}
                tier="Tier0"
                showMinSpendTooltip={false}
                size="sm"
              />
            ) : null}
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2 leading-snug">
            {campaign.title}
          </h3>
          <div className="mb-3">
            <AuthorInline
              address={campaign.creator}
              href={`/u/${encodeURIComponent(campaign.creator)}`}
              prefix=""
              className="mt-0 mb-0 min-w-0"
            />
          </div>
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
      {l1Modal ? (
        <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} />
      ) : null}
    </>
  );
}
