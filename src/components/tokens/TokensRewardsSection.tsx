'use client';

import Link from 'next/link';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS } from '@/lib/rewards/types';
import { getKrexTierUi } from '@/lib/rewards/tierUi';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { TierBadge } from '@/components/rewards/TierBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokensRewardsSection() {
  const { balance: krexBalance, tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const currentTier = KREX_TIERS[krexTier];
  const tierUi = getKrexTierUi(krexTier);
  const discountPercent = krexTierDiscountPercent(krexTier);
  const hasDiscount = discountPercent > 0;
  const sampleModule = TOKEN_MODULE_OFFERS[0];

  return (
    <section className={`${CHRONICLES_PANEL} overflow-hidden`}>
      <div className={`border-b border-zinc-200 dark:border-zinc-800 px-5 py-5 sm:px-6 sm:py-6 ${tierUi.panel}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="h-7 w-1.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
                style={{ backgroundColor: TOKENS_ACCENT }}
                aria-hidden="true"
              />
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                Token Builder Rewards &amp; Discounts
              </h3>
            </div>
            <p className="kx-body-sm max-w-2xl">
              KREX holders unlock discounts on premium token modules: roadmap editors, featured listings, Hub integrations, and more.
            </p>
          </div>
          <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} className="shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800">
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900">
          <DAppSectionHeader title="Module discount" className="mb-4" />
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
            Example: {sampleModule.title} unlock drops from {sampleModule.unlockPriceKas} KAS
            {hasDiscount
              ? ` to ~${Math.max(1, Math.round(sampleModule.unlockPriceKas * (1 - discountPercent / 100)))} KAS at your tier.`
              : '. Hold 1M+ KREX to unlock discounts.'}
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900">
          <DAppSectionHeader title="Utility-as-a-Service" className="mb-4" />
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">Plug and use</span>
          </div>
          <p className="kx-body-sm mb-4">
            Connect tokens to Kasparex Hub products so communities get instant payments, swaps, tips, and dApp access from day one.
          </p>
          <Link href="/tokens/dashboard" className="k-cta-primary inline-flex text-sm">
            Open Developer Dashboard
          </Link>
        </div>
      </div>

      {nftStatus && (nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX) ? (
        <div className="px-5 py-4 sm:px-6 border-t border-zinc-200 dark:border-zinc-800 bg-[#02abb8]/5 text-center">
          <p className="kx-body-sm font-semibold text-[#02abb8] dark:text-[#66dfe8]">
            NFT multiplier active: extra discounts stack on premium token modules.
          </p>
        </div>
      ) : null}
    </section>
  );
}
