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
  const pct = covenantCampaignProgress(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const goalReached = covenantCampaignGoalReached(campaign);
  const backers = covenantCampaignBackerCount(campaign);

  return (
    <Link
      href={`/donations/covenant/${campaign.id}`}
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
    >
      <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        <img src={DEFAULT_DONATION_IMAGE} alt="" className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900/70 text-white">
          L1 Covenant · Simulator
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
            {shortKaspaAddr(campaign.creator)}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200">
              Kaspa L1
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
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {campaign.status}
              </span>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2">{campaign.title}</h3>
        {campaign.memo ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">{campaign.memo}</p>
        ) : null}
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            {raised.toFixed(2)} / {goal.toFixed(2)} KAS
          </span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {backers} backer{backers === 1 ? '' : 's'} · ends {new Date(campaign.deadline).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
