'use client';

import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import type { KREXTier } from '@/lib/rewards/types';

export function CrowdKasFeeCard({
  title,
  feeLabel,
  basePoints,
  tier,
  note,
}: {
  title: string;
  feeLabel: string;
  basePoints?: number;
  tier?: KREXTier;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <DAppSectionHeader
        title={title}
        className="mb-0"
        right={<span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{feeLabel}</span>}
      />
      {note ? <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{note}</p> : null}
      {basePoints && basePoints > 0 && tier != null ? (
        <HubPointsEarnRow basePoints={basePoints} tier={tier} />
      ) : null}
    </div>
  );
}

export function CrowdKasPricingCards({
  network,
  l1CreateFeeKas,
  l2CreateFeeIkas,
  l1EditFeeKas,
  l2EditFeeIkas,
  deleteFee,
  tier,
  className = '',
}: {
  network: 'l1' | 'l2';
  l1CreateFeeKas: number;
  l2CreateFeeIkas: number;
  l1EditFeeKas: number;
  l2EditFeeIkas: number;
  deleteFee: number;
  tier?: KREXTier;
  className?: string;
}) {
  const formatKas = (kas: number) => (kas <= 0 ? 'Free' : `${kas} KAS`);
  const formatIkas = (ikas: number) => (ikas <= 0 ? 'Free' : `${ikas} iKAS`);

  if (network === 'l1') {
    return (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
        <CrowdKasFeeCard
          title="L1 create"
          feeLabel={formatKas(l1CreateFeeKas)}
          basePoints={HUB_EARN_POINTS.crowdkasCampaignCreate}
          tier={tier}
          note="Base 25 KAS plus payload size and modules. Pay in KAS, KREX, or supported tokens."
        />
        <CrowdKasFeeCard
          title="L1 edit"
          feeLabel={formatKas(l1EditFeeKas)}
          tier={tier}
          note="Base 5 KAS plus any payload growth and new modules."
        />
        <CrowdKasFeeCard
          title="Delete"
          feeLabel={deleteFee <= 0 ? 'Free' : formatKas(deleteFee)}
          tier={tier}
          note="Only when the campaign has received no donations."
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
      <CrowdKasFeeCard
        title="L2 create"
        feeLabel={formatIkas(l2CreateFeeIkas)}
        basePoints={HUB_EARN_POINTS.crowdkasCampaignCreate}
        tier={tier}
        note="Base 25 iKAS plus payload size. Network gas is charged separately in iKAS."
      />
      <CrowdKasFeeCard
        title="L2 edit"
        feeLabel={formatIkas(l2EditFeeIkas)}
        tier={tier}
        note="Base 5 iKAS plus any payload growth. Paid modules bill in KAS on L1."
      />
      <CrowdKasFeeCard
        title="Delete"
        feeLabel={deleteFee <= 0 ? 'Free' : formatIkas(deleteFee)}
        tier={tier}
        note="Only when the campaign has received no donations."
      />
    </div>
  );
}
