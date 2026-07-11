'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import {
  covenantCampaignBackerCount,
  covenantCampaignGoalKas,
  covenantCampaignIsActive,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
  covenantCampaignGoalReached,
} from '@/lib/donations/covenantCrowdfund';
import { DEFAULT_DONATION_IMAGE } from '@/lib/donations/constants';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { placeholderDApps } from '@/lib/dapps';
import { AuthorInline } from '@/components/ui/AuthorInline';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;
const PLEDGE_HUB_POINTS_BASE = getHubPointsBaseForAction(CROWDFUND_DAPP, 'pledge');

export function CovenantCrowdfundCampaignCard({
  campaign,
  footer,
}: {
  campaign: CrowdfundCampaign;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const goalReached = covenantCampaignGoalReached(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const deadline = new Date(campaign.deadline);
  const profilePath = `/u/${encodeURIComponent(campaign.creator)}`;
  const statusLabel =
    campaign.status === 'funding' ? 'FUNDING' : campaign.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/donations/covenant/${campaign.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/donations/covenant/${campaign.id}`);
        }
      }}
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
    >
      <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        <img src={DEFAULT_DONATION_IMAGE} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">{campaign.title}</p>
            <AuthorInline
              address={campaign.creator}
              href={profilePath}
              prefix=""
              className="mt-0"
            />
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {statusLabel}
            </span>
            {isLive && PLEDGE_HUB_POINTS_BASE > 0 ? (
              <HubPointsEarnBadge
                basePoints={PLEDGE_HUB_POINTS_BASE}
                tier="Tier0"
                showMinSpendTooltip={false}
                size="sm"
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                L1 • Covenant
              </span>
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
        <p className="kx-body">
          {backers} backer{backers === 1 ? '' : 's'} · Ends {deadline.toLocaleDateString()}
        </p>
        {footer ? <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">{footer}</div> : null}
      </div>
    </div>
  );
}
