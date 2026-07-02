'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { balanceToKrexVisualTier, KREX_TIER_UI } from '@/lib/rewards/tierUi';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { KrexTierPerksTooltipTable } from '@/components/rewards/KrexTierPerksTooltipTable';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function VBlogDashboardBenefitsPanel({
  className = '',
  variant = 'panel',
}: {
  className?: string;
  variant?: 'panel' | 'compact';
}) {
  const pricing = useVBlogPricing();
  const { balance: krexBalance, tier } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

  const discountPercent = pricing.tier.krexDiscountPercent;
  const publishPts = computeEarnedHubPoints(HUB_EARN_POINTS.vblogArticleCreate, tier);

  const visualTier = balanceToKrexVisualTier(krexBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;

  const buyKrexButtonClass =
    'shrink-0 k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] dark:!bg-[#02abb8] dark:hover:!bg-[#028a94]';

  if (variant === 'compact') {
    const feePerk =
      discountPercent > 0 ? `${discountPercent}% discount` : 'Hold 1M+ KREX for a discount';
    const pointsPerk =
      tier !== 'Tier0' ? `Multiplier (${formatHubPointsTierLabel(tier)})` : 'No multiplier';

    return (
      <>
        <TooltipProvider>
          <aside
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-md max-w-full ${ui.panel} ${className}`.trim()}
            aria-label="Benefits. Hover for KREX tier details."
          >
            <Tooltip content={<KrexTierPerksTooltipTable title="KREX tier perks" />}>
              <div className="flex items-center gap-2 min-w-0 cursor-help">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#02abb8] dark:text-[#66dfe8] whitespace-nowrap">
                  Benefits
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wide whitespace-nowrap ${ui.badge}`}
                >
                  {ui.label}
                </span>
                <span className="hidden md:inline text-[13px] leading-none text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  {feePerk}
                </span>
                <span className="hidden lg:inline text-[13px] leading-none text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {pointsPerk}
                </span>
                <span className={`hidden sm:inline text-[13px] leading-none font-semibold whitespace-nowrap ${ui.accent}`}>
                  {formatKrexMillions(krexBalance)} KREX
                </span>
              </div>
            </Tooltip>
            <button
              type="button"
              onClick={() => setIsKrexWizardOpen(true)}
              className={`${buyKrexButtonClass} !h-auto !py-1 !px-3 !text-xs !font-bold`}
            >
              Buy KREX
            </button>
          </aside>
        </TooltipProvider>
        <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
      </>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip content={<KrexTierPerksTooltipTable title="KREX tier perks" />}>
          <aside
            className={`w-full rounded-xl border p-3.5 shadow-lg cursor-help ${ui.panel} ${className}`.trim()}
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
              Hold KREX. Pay Less. Earn More.
            </h2>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                <span className={ui.accent}>•</span>{' '}
                {discountPercent > 0
                  ? `${discountPercent}% off vBlog fees (${tierLabel})`
                  : 'Stack 1M+ KREX for 2% off fees'}
              </li>
              <li>
                <span className={ui.accent}>•</span> Publish earns +{publishPts} Hub Points at your tier
                {tier !== 'Tier0' ? ` (${formatHubPointsTierLabel(tier)} multiplier)` : ' (base amount)'}
              </li>
            </ul>
            <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${ui.status}`}>
              <span className="font-semibold">{formatKrexMillions(krexBalance)} KREX held.</span>{' '}
              {ui.statusText}
            </div>
            <button
              type="button"
              onClick={() => setIsKrexWizardOpen(true)}
              className={`mt-2.5 w-full ${buyKrexButtonClass} !py-2 !text-sm`}
            >
              Buy KREX
            </button>
          </aside>
        </Tooltip>
      </TooltipProvider>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
