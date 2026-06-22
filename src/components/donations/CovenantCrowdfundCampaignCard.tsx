'use client';

import Link from 'next/link';
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
import { shortKaspaAddr } from '@/components/dapps/covenant/CovenantWidgetUi';

export function CovenantCrowdfundCampaignCard({ campaign }: { campaign: CrowdfundCampaign }) {
  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const goalReached = covenantCampaignGoalReached(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const deadline = new Date(campaign.deadline);

  return (
    <Link
      href={`/donations/covenant/${campaign.id}`}
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
    >
      <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        <img src={DEFAULT_DONATION_IMAGE} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
            {shortKaspaAddr(campaign.creator)}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
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
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">{campaign.title}</p>
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {raised.toFixed(4)} / {goal.toFixed(4)} KAS
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {backers} backer{backers === 1 ? '' : 's'} · Ends {deadline.toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
