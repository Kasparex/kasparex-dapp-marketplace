'use client';

import { useMemo, useRef, useState } from 'react';
import { useCrowdKasPricing } from '@/hooks/useCrowdKasPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { balanceToKrexVisualTier, KREX_TIER_UI } from '@/lib/rewards/tierUi';
import { Tooltip } from '@/components/ui/Tooltip';
import { KrexTierPerksTooltipTable } from '@/components/rewards/KrexTierPerksTooltipTable';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const TIER_TOOLTIP = <KrexTierPerksTooltipTable title="KREX tier perks" />;

export function CrowdKasDashboardBenefitsPanel({
  className = '',
  variant = 'panel',
  hideBuyButton = false,
}: {
  className?: string;
  variant?: 'panel' | 'compact';
  hideBuyButton?: boolean;
}) {
  const pricing = useCrowdKasPricing();
  const { balance: krexBalance, tier, isLoading } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const stableBalanceRef = useRef(0);
  if (!isLoading) stableBalanceRef.current = krexBalance;
  const displayBalance = isLoading ? stableBalanceRef.current : krexBalance;
  const discountPercent = KREX_TIERS[tier].feeDiscountPercent;
  const createPts = computeEarnedHubPoints(HUB_EARN_POINTS.crowdkasCampaignCreate, tier);
  const visualTier = balanceToKrexVisualTier(displayBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;
  const tooltipContent = useMemo(() => TIER_TOOLTIP, []);

  const buyKrexButtonClass = 'hub-cta-btn shrink-0 k-control-btn !h-auto';

  if (variant === 'compact') {
    const feePerk =
      discountPercent > 0 ? `${discountPercent}% module discount` : 'Hold 1M+ KREX for module discounts';
    const pointsPerk =
      tier !== 'Tier0' ? `Multiplier (${formatHubPointsTierLabel(tier)})` : 'No multiplier';

    return (
      <>
        <aside
          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-md max-w-full border-emerald-500/25 bg-emerald-500/[0.06] dark:bg-emerald-950/30 ${className}`.trim()}
          aria-label="Benefits. Hover for KREX tier details."
        >
          <Tooltip content={tooltipContent}>
            <div className="flex items-center gap-2 min-w-0 cursor-help">
              <span className="text-xs font-black uppercase tracking-[0.12em] whitespace-nowrap text-emerald-800 dark:text-emerald-300">
                Benefits
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wide whitespace-nowrap ${ui.badge}`}>
                {ui.label}
              </span>
              <span className="hidden md:inline text-[13px] leading-none text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {feePerk}
              </span>
              <span className="hidden lg:inline text-[13px] leading-none text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {pointsPerk}
              </span>
              <span className={`hidden sm:inline text-[13px] leading-none font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-300`}>
                {formatKrexMillions(displayBalance)} KREX
              </span>
            </div>
          </Tooltip>
          <button
            type="button"
            onClick={() => setIsKrexWizardOpen(true)}
            className={`${buyKrexButtonClass} !h-auto !py-1 !px-3 !text-xs !font-bold !border-emerald-500/30`}
          >
            Buy KREX
          </button>
        </aside>
        <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Tooltip content={tooltipContent}>
        <aside
          className={`w-full rounded-xl border border-emerald-500/25 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-zinc-900 dark:via-emerald-950/30 dark:to-zinc-900 p-3.5 shadow-lg cursor-help ${className}`.trim()}
          aria-label="Creator perks. Hover for KREX tier details."
        >
          <DAppSectionHeader
            title="Creator perks"
            className="mb-2"
            right={
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
                {ui.label}
              </span>
            }
          />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-2.5">
            Hold KREX. Unlock modules. Earn more.
          </h2>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <span className="text-emerald-600 dark:text-emerald-400">•</span>{' '}
              {discountPercent > 0
                ? `${discountPercent}% off paid module unlocks (${tierLabel})`
                : `Stack 1M+ KREX for ${KREX_TIERS.Tier1.feeDiscountPercent}% off modules`}
            </li>
            <li>
              <span className="text-emerald-600 dark:text-emerald-400">•</span> Create earns +{createPts} Hub Points at your tier
              {tier !== 'Tier0' ? ` (${formatHubPointsTierLabel(tier)} multiplier)` : ' (base amount)'}
            </li>
          </ul>
          <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${ui.status}`}>
            <span className="font-semibold">{formatKrexMillions(displayBalance)} KREX held.</span>{' '}
            {ui.statusText}
          </div>
          {!hideBuyButton ? (
            <button
              type="button"
              onClick={() => setIsKrexWizardOpen(true)}
              className={`mt-2.5 w-full ${buyKrexButtonClass} !py-2 !text-sm !border-emerald-500/30`}
            >
              Buy KREX
            </button>
          ) : null}
        </aside>
      </Tooltip>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
