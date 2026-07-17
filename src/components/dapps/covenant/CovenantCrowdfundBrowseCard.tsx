'use client';

import Link from 'next/link';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import { sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import { covenantCardClass, shortKaspaAddr } from '@/components/dapps/covenant/CovenantWidgetUi';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { placeholderDApps } from '@/lib/dapps';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;
const PLEDGE_HUB_POINTS_BASE = getHubPointsBaseForAction(CROWDFUND_DAPP, 'pledge');

function statusLabel(status: CrowdfundCampaign['status']): string {
  if (status === 'funding') return 'FUNDING';
  if (status === 'succeeded') return 'SUCCEEDED';
  return 'FAILED';
}

type CovenantCrowdfundBrowseCardProps = {
  campaign: CrowdfundCampaign;
  minKas: number;
  walletAddress?: string | null;
  pledgeAmount: string;
  onPledgeAmountChange: (value: string) => void;
  onPledge: () => void;
  onClaim?: () => void;
  claimFeeLabel?: string;
  onRefund?: (pledgeId: string, amountKas: number) => void;
  krexTier?: import('@/lib/rewards/types').KREXTier;
  busy?: boolean;
  pledgeBusy?: boolean;
};

export function CovenantCrowdfundBrowseCard({
  campaign,
  minKas,
  walletAddress,
  pledgeAmount,
  onPledgeAmountChange,
  onPledge,
  onClaim,
  claimFeeLabel,
  onRefund,
  krexTier = 'Tier0',
  busy = false,
  pledgeBusy = false,
}: CovenantCrowdfundBrowseCardProps) {
  const raised = sompiToKasNumber(campaign.raisedSompi);
  const goal = sompiToKasNumber(campaign.goalSompi);
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const isCreator =
    walletAddress && normalizeAddr(walletAddress) === normalizeAddr(campaign.creator);
  const profilePath = `/u/${encodeURIComponent(campaign.creator)}`;

  return (
    <div className={covenantCardClass}>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
          <Link
            href={profilePath}
            className="text-xs font-semibold text-[#02abb8] hover:underline"
          >
            Creator profile
          </Link>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {shortKaspaAddr(campaign.creator)}
          </span>
          <KxCopyIconButton value={campaign.creator} label="Copy creator wallet address" />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {statusLabel(campaign.status)}
          </span>
          {campaign.status === 'funding' && PLEDGE_HUB_POINTS_BASE > 0 ? (
            <HubPointsEarnBadge
              basePoints={PLEDGE_HUB_POINTS_BASE}
              tier={krexTier}
              showMinSpendTooltip={false}
              size="sm"
            />
          ) : null}
        </div>
      </div>

      <div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100 gap-2">
        <span className="min-w-0">{campaign.title}</span>
      </div>

      {campaign.memo ? <p className="kx-body">{campaign.memo}</p> : null}

      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-[#02abb8] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="kx-body">
        {raised.toFixed(4)} / {goal} KAS ({pct.toFixed(0)}%)
      </p>
      <p className="text-xs text-zinc-500 kx-body">
        Ends {new Date(campaign.deadline).toLocaleString()}
      </p>

      {campaign.status === 'funding' ? (
        <div className="flex gap-2 pt-1">
          <input
            type="number"
            min={minKas}
            step="0.01"
            className="k-input text-sm flex-1"
            placeholder="Pledge KAS"
            value={pledgeAmount}
            onChange={(e) => onPledgeAmountChange(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            className="px-4 py-2 bg-[#02abb8] text-white rounded-lg text-sm font-medium hover:bg-[#028a94] shrink-0 disabled:opacity-50 disabled:cursor-wait"
            onClick={onPledge}
          >
            {pledgeBusy ? 'Pledging...' : 'Pledge'}
          </button>
        </div>
      ) : null}

      {isCreator && campaign.status === 'succeeded' && !campaign.claimedAt && onClaim ? (
        <button
          type="button"
          disabled={busy}
          className="k-control-btn !border-zinc-300 dark:!border-zinc-700 disabled:opacity-50 disabled:cursor-wait"
          onClick={onClaim}
        >
          {claimFeeLabel ?? 'Claim raised funds'}
        </button>
      ) : null}

      {campaign.status === 'failed' && walletAddress && onRefund
        ? campaign.pledges
            .filter(
              (p) =>
                !p.refunded && normalizeAddr(p.backer) === normalizeAddr(walletAddress),
            )
            .map((p) => (
              <button
                key={p.id}
                type="button"
                className="k-control-btn !border-zinc-300 dark:!border-zinc-700 mt-2 text-xs"
                onClick={() => onRefund(p.id, sompiToKasNumber(p.amountSompi))}
              >
                Refund {sompiToKasNumber(p.amountSompi)} KAS
              </button>
            ))
        : null}
    </div>
  );
}
