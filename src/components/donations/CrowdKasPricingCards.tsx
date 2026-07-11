'use client';

import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import type { KREXTier } from '@/lib/rewards/types';

export function CrowdKasFeeCard({
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
          <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
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

export function CrowdKasPricingCards({
  verifyFee,
  createFee,
  editFee,
  deleteFee,
  tier,
  className = '',
}: {
  verifyFee: number;
  createFee: number;
  editFee: number;
  deleteFee: number;
  tier?: KREXTier;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`.trim()}>
      <CrowdKasFeeCard title="Wallet verify" feeKas={verifyFee} tier={tier} note="One-time 1 wei check on Igra." />
      <CrowdKasFeeCard
        title="Create campaign"
        feeKas={createFee}
        basePoints={HUB_EARN_POINTS.crowdkasCampaignCreate}
        tier={tier}
        note="Gas on Igra; metadata stored on IPFS."
      />
      <CrowdKasFeeCard title="Edit / update" feeKas={editFee} tier={tier} />
      <CrowdKasFeeCard title="Delete" feeKas={deleteFee} tier={tier} note="Only empty campaigns." />
    </div>
  );
}
