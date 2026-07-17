'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';
import type { StoreListingQuote } from '@/lib/store/listingQuote';

export function StoreListingCalculationPanel({
  quote,
  isEdit,
  tier,
  krexBalance,
  footer,
  className = '',
  flowBusy = false,
  flowComplete = false,
}: {
  quote: StoreListingQuote;
  isEdit: boolean;
  tier: KREXTier;
  krexBalance: number;
  footer?: ReactNode;
  className?: string;
  flowBusy?: boolean;
  flowComplete?: boolean;
}) {
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const tierConfig = KREX_TIERS[tier];
  const hubPoints = isEdit ? 0 : computeEarnedHubPoints(HUB_EARN_POINTS.storeProductList, tier);
  const showBuyKrex = quote.discountPercent <= 0 && krexBalance < KREX_TIERS.Tier1.minKREX;

  return (
    <aside className={`${KX_CALCULATION_ASIDE} ${className}`.trim()}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DAppSectionHeader title="Calculation breakdown" className="!mb-0" />
        <TierBadge tier={tier} isUnlocked={krexBalance > 0} />
      </div>

      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between gap-2">
          <span>{isEdit ? 'Update fee' : 'Listing fee'}</span>
          <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {quote.baseFeeKas} KAS
          </span>
        </div>
        {quote.moduleLines.map((line) => (
          <div key={line.id} className="flex justify-between gap-2">
            <span className="truncate">{line.title}</span>
            <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              +{line.kas} KAS
            </span>
          </div>
        ))}
        {quote.modulesFeeKas > 0 ? (
          <div className="flex justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
            <span>Modules subtotal</span>
            <span className="font-semibold text-[#02abb8] tabular-nums">{quote.modulesFeeKas} KAS</span>
          </div>
        ) : null}
        {quote.discountKas > 0 ? (
          <div className="flex justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
            <span>Subtotal</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {quote.subtotalKas} KAS
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{quote.totalKas} KAS</p>
      </div>

      <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
        {isEdit
          ? 'One Kaspa L1 payment covers your listing update. Module fees add to the base update fee when enabled.'
          : 'One Kaspa L1 payment lists your product on the Store. Ensure your wallet has enough KAS for the treasury fee.'}
      </div>

      {quote.discountKas > 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
          KREX discount: -{quote.discountKas.toFixed(2)} KAS ({quote.discountPercent}% off total).
        </div>
      ) : null}

      {!isEdit && hubPoints > 0 ? (
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Hub points on action</span>
          <span className="inline-flex items-center gap-1.5">
            <HubPointsEarnBadge points={hubPoints} baseSpendKas={quote.subtotalKas} />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              ({tier !== 'Tier0' ? `${formatHubPointsTierLabel(tier)} multiplier` : 'base amount'})
            </span>
          </span>
        </div>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Current tier: {tierConfig.label} ({tierConfig.description})
      </p>

      {showBuyKrex ? (
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
        >
          Buy KREX to unlock discount
        </button>
      ) : null}

      {footer ? <div className="space-y-3">{footer}</div> : null}

      <HubFlowProgress
        steps={getHubFlowPreset('hubPublish')}
        busy={flowBusy}
        complete={flowComplete}
      />

      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </aside>
  );
}
