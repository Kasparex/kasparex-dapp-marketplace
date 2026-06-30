'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export function AuthorPricing() {
  const { createFee, editFee, deleteFee } = useVBlogPricing();

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Publishing Fee</span>
          <span className="text-base font-black text-[#02abb8] tabular-nums text-right">
            {createFee} KAS
            <span className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +{HUB_EARN_POINTS.vblogArticleCreate}
            </span>
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Edit Fee</span>
          <span className="text-base font-black text-[#02abb8] tabular-nums text-right">
            {editFee} KAS
            <span className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +{HUB_EARN_POINTS.vblogArticleUpdate}
            </span>
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Delete Fee</span>
          <span className="text-base font-black text-[#02abb8] tabular-nums">{deleteFee} KAS</span>
        </div>
      </div>
    </div>
  );
}
