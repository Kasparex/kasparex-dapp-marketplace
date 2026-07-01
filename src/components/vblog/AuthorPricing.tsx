'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import type { KREXTier } from '@/lib/rewards/types';

function FeeCard({
  title,
  feeKas,
  basePoints,
  tier,
}: {
  title: string;
  feeKas: number;
  basePoints: number;
  tier: KREXTier;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider pt-0.5">{title}</span>
        <p className="text-base font-black text-[#02abb8] tabular-nums">{feeKas} KAS</p>
      </div>
      <HubPointsEarnRow basePoints={basePoints} tier={tier} />
    </div>
  );
}

export function AuthorPricing() {
  const { createFee, editFee, deleteFee } = useVBlogPricing();
  const { tier } = useKREXBalance();

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeeCard
          title="Publishing Fee"
          feeKas={createFee}
          basePoints={HUB_EARN_POINTS.vblogArticleCreate}
          tier={tier}
        />
        <FeeCard
          title="Edit Fee"
          feeKas={editFee}
          basePoints={HUB_EARN_POINTS.vblogArticleUpdate}
          tier={tier}
        />
        <FeeCard title="Delete Fee" feeKas={deleteFee} basePoints={0} tier={tier} />
      </div>
    </div>
  );
}
