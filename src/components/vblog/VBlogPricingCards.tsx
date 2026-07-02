'use client';

import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import type { KREXTier } from '@/lib/rewards/types';

export function VBlogFeeCard({
  title,
  feeKas,
  basePoints,
  tier,
  note,
}: {
  title: string;
  feeKas: number;
  basePoints?: number;
  tier?: KREXTier;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <DAppSectionHeader
        title={title}
        className="mb-0"
        right={
          <span className="text-base font-bold tabular-nums text-[#02abb8]">
            {feeKas <= 0 ? 'Free' : `${feeKas} KAS`}
          </span>
        }
      />
      {note ? <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{note}</p> : null}
      {basePoints && basePoints > 0 && tier != null ? (
        <HubPointsEarnRow basePoints={basePoints} tier={tier} />
      ) : null}
    </div>
  );
}

export function VBlogPricingCards({
  createFee,
  editFee,
  deleteFee,
  tier,
  className = '',
}: {
  createFee: number;
  editFee: number;
  deleteFee: number;
  tier?: KREXTier;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
      <VBlogFeeCard
        title="Publishing Fee"
        feeKas={createFee}
        basePoints={HUB_EARN_POINTS.vblogArticleCreate}
        tier={tier}
      />
      <VBlogFeeCard
        title="Edit / Update"
        feeKas={editFee}
        basePoints={HUB_EARN_POINTS.vblogArticleUpdate}
        tier={tier}
      />
      <VBlogFeeCard title="Delete Fee" feeKas={deleteFee} tier={tier} />
    </div>
  );
}
