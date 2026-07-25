'use client';

import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { KREX_TIERS } from '@/lib/rewards/types';
import { getKrexTierUi } from '@/lib/rewards/tierUi';
import { TierBadge } from '@/components/rewards/TierBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';
import { formatHubPointsTierLabel } from '@/lib/rewards/hub-points';

export function VBlogRewardsSection() {
  const { balance: krexBalance, tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const pricing = useVBlogPricing();

  const currentTier = KREX_TIERS[krexTier];
  const tierUi = getKrexTierUi(krexTier);
  const hasDiscount = pricing.tier.hasKREXDiscount || pricing.tier.hasNFTPerks;
  const discountPercent = pricing.tier.krexDiscountPercent;

  return (
    <section className={`${CHRONICLES_PANEL} overflow-hidden`}>
      <div className={`border-b border-zinc-200 dark:border-zinc-800 px-5 py-5 sm:px-6 sm:py-6 ${tierUi.panel}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="h-7 w-1.5 shrink-0 rounded-full bg-[#e30d1b] shadow-[0_0_10px_rgba(227, 13, 27,0.35)] -skew-y-12"
                aria-hidden="true"
              />
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                Author Rewards &amp; Discounts
              </h3>
            </div>
            <p className="kx-body-sm max-w-2xl">
              Maximize your earnings through KREX holdings and NFT ownership. Tier perks apply to publication fees and Hub Points on create actions.
            </p>
          </div>
          <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} className="shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800">
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900">
          <DAppSectionHeader title="Publication discount" className="mb-4" />
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">
              {hasDiscount ? `${discountPercent}%` : '0%'}
            </span>
            {hasDiscount ? (
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tierUi.badge}`}>
                {currentTier.label}
              </span>
            ) : null}
          </div>
          <p className="kx-body-sm">
            Your on-chain creation fee is reduced based on your KREX tier
            {krexTier !== 'Tier0' ? ` (${formatHubPointsTierLabel(krexTier)} Hub Points multiplier).` : '.'}
            {krexBalance === 0 ? ' Hold 1M+ KREX to unlock discounts.' : null}
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900">
          <DAppSectionHeader title="Magazine revenue share" className="mb-4" />
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">100% transparency</span>
          </div>
          <p className="kx-body-sm">
            When linked to a magazine, authors receive a direct share of community-driven revenue. Verified by Kaspa GHOSTDAG on-chain settlement.
          </p>
        </div>
      </div>

      {nftStatus && (nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX) ? (
        <div className="px-5 py-4 sm:px-6 border-t border-zinc-200 dark:border-zinc-800 bg-[#e30d1b]/5 text-center">
          <p className="kx-body-sm font-semibold text-[#e30d1b] dark:text-[#ff6b73]">
            NFT multiplier active: premium text limits and enhanced on-chain visibility.
          </p>
        </div>
      ) : null}
    </section>
  );
}
