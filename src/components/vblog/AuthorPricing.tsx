'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

function HubPointsEarned({ points }: { points: number }) {
  return (
    <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
      <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
      </svg>
      +{points} pts
    </p>
  );
}

export function AuthorPricing() {
  const { createFee, editFee, deleteFee } = useVBlogPricing();

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider pt-0.5">Publishing Fee</span>
          <div className="text-right">
            <p className="text-base font-black text-[#02abb8] tabular-nums">{createFee} KAS</p>
            <HubPointsEarned points={HUB_EARN_POINTS.vblogArticleCreate} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider pt-0.5">Edit Fee</span>
          <div className="text-right">
            <p className="text-base font-black text-[#02abb8] tabular-nums">{editFee} KAS</p>
            <HubPointsEarned points={HUB_EARN_POINTS.vblogArticleUpdate} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Delete Fee</span>
          <span className="text-base font-black text-[#02abb8] tabular-nums">{deleteFee} KAS</span>
        </div>
      </div>
    </div>
  );
}
