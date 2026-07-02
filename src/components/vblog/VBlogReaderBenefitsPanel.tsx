'use client';

import { useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { balanceToKrexVisualTier, KREX_TIER_UI } from '@/lib/rewards/tierUi';
import { getVBlogModuleCombinedDiscountPercent } from '@/lib/vblog/modules';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { KrexTierPerksTooltipTable } from '@/components/rewards/KrexTierPerksTooltipTable';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function VBlogReaderBenefitsPanel({ className = '' }: { className?: string }) {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

  const visualTier = balanceToKrexVisualTier(krexBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;
  const moduleDiscount = getVBlogModuleCombinedDiscountPercent(tier, nftStatus);
  const tipPts = computeEarnedHubPoints(HUB_EARN_POINTS.vblogTip, tier);
  const unlockPts = computeEarnedHubPoints(HUB_EARN_POINTS.vblogPremiumUnlock, tier);

  const buyKrexButtonClass =
    'shrink-0 k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] dark:!bg-[#02abb8] dark:hover:!bg-[#028a94]';

  return (
    <>
      <TooltipProvider>
        <Tooltip content={<KrexTierPerksTooltipTable title="Reader tier perks" />}>
          <aside
            className={`w-full rounded-xl border p-3.5 shadow-lg cursor-help ${ui.panel} ${className}`.trim()}
            aria-label="Reader benefits. Hover for KREX tier details."
          >
            <DAppSectionHeader
              title="Benefits"
              className="mb-2"
              right={
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
                  {ui.label}
                </span>
              }
            />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-2.5">
              Hold KREX. Unlock for Less. Earn More.
            </h2>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                <span className={ui.accent}>•</span>{' '}
                {moduleDiscount > 0
                  ? `${moduleDiscount}% off premium modules (${tierLabel})`
                  : 'Stack 1M+ KREX for module discounts'}
              </li>
              <li>
                <span className={ui.accent}>•</span> Tips earn +{tipPts} Hub Points at your tier
                {tier !== 'Tier0' ? ` (${formatHubPointsTierLabel(tier)} multiplier)` : ' (base amount)'}
              </li>
              <li>
                <span className={ui.accent}>•</span> Premium unlocks earn +{unlockPts} Hub Points
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
