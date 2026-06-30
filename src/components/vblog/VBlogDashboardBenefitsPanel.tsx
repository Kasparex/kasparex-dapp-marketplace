'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getVBlogBaseFeeKas } from '@/lib/vblog/pricing';

type KrexPerkVisualTier = 'none' | 'starter' | 'builder' | 'vip';
type VBlogDashboardBenefitsLayout = 'horizontal' | 'vertical';

function getKrexPerkVisualTier(balance: number): KrexPerkVisualTier {
  if (balance <= 0) return 'none';
  if (balance < 1_000_000) return 'starter';
  if (balance < 10_000_000) return 'builder';
  return 'vip';
}

const TIER_UI: Record<
  KrexPerkVisualTier,
  {
    label: string;
    panel: string;
    status: string;
    statusText: string;
    accent: string;
    rail: string;
    badge: string;
  }
> = {
  none: {
    label: 'No KREX',
    panel:
      'border-zinc-300/80 bg-gradient-to-br from-zinc-100 via-white to-zinc-200/80 dark:border-zinc-500/35 dark:from-zinc-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300',
    statusText: 'Hold KREX to unlock fee discounts and creator perks.',
    accent: 'text-zinc-500 dark:text-zinc-400',
    rail: 'bg-zinc-400 dark:bg-zinc-500',
    badge: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200',
  },
  starter: {
    label: 'Starter',
    panel:
      'border-orange-300/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/70 dark:border-orange-400/35 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-100',
    statusText: 'Under 1M KREX. Stack more to climb perk tiers.',
    accent: 'text-orange-600 dark:text-orange-400',
    rail: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
  },
  builder: {
    label: 'Builder',
    panel:
      'border-yellow-300/80 bg-gradient-to-br from-yellow-50 via-white to-amber-100/70 dark:border-yellow-400/35 dark:from-yellow-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-yellow-300/80 bg-yellow-50 text-yellow-900 dark:border-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-100',
    statusText: '1M+ KREX. You are building toward the 10M discount tier.',
    accent: 'text-yellow-700 dark:text-yellow-400',
    rail: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
  },
  vip: {
    label: 'VIP',
    panel:
      'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 dark:border-emerald-400/35 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    statusText: '10M+ KREX. Your vBlog fee discount is active.',
    accent: 'text-emerald-700 dark:text-emerald-400',
    rail: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
};

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type VBlogDashboardBenefitsPanelProps = {
  layout?: VBlogDashboardBenefitsLayout;
};

export function VBlogDashboardBenefitsPanel({ layout = 'vertical' }: VBlogDashboardBenefitsPanelProps) {
  const pricing = useVBlogPricing();
  const { balance: krexBalance } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

  const fullBaseFee = getVBlogBaseFeeKas('create');
  const sampleQuote = pricing.estimateQuote(
    {
      title: 'Sample',
      description: 'Sample article',
      content: 'Sample content for pricing preview.',
      category: 'News',
      tags: [],
      featuredImage: 'https://example.com/image.jpg',
    },
    'create',
  );
  const discountPercent = fullBaseFee > 0 ? Math.round(((fullBaseFee - sampleQuote.baseFeeKas) / fullBaseFee) * 100) : 0;

  const visualTier = getKrexPerkVisualTier(krexBalance);
  const ui = TIER_UI[visualTier];
  const isVertical = layout === 'vertical';

  return (
    <>
      <aside
        className={`w-full shrink-0 rounded-2xl border p-5 shadow-lg ${ui.panel} ${
          isVertical ? 'xl:w-[320px]' : 'xl:w-[340px]'
        }`}
      >
        <div className={`flex gap-4 ${isVertical ? 'flex-col' : 'flex-row items-start justify-between'}`}>
          {isVertical ? (
            <div className={`w-full rounded-xl ${ui.rail} h-1.5`} aria-hidden />
          ) : null}

          <div className={`min-w-0 flex-1 ${isVertical ? 'space-y-3' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#02abb8] dark:text-[#66dfe8]">
                Creator perks
              </p>
              <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
                {ui.label}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              Hold KREX. Pay Less. Earn More.
            </h2>

            <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                <span className={ui.accent}>•</span> Up to {discountPercent || 80}% off publish fees (10M+ KREX)
              </li>
              <li>
                <span className={ui.accent}>•</span> +{HUB_EARN_POINTS.vblogArticleCreate} pts publish / +{HUB_EARN_POINTS.vblogArticleUpdate} update
              </li>
            </ul>

            <div className={`rounded-xl border px-3 py-2.5 text-xs leading-snug ${ui.status}`}>
              <span className="font-semibold">{formatKrexMillions(krexBalance)} KREX held.</span>{' '}
              {ui.statusText}
            </div>

            <button
              type="button"
              onClick={() => setIsKrexWizardOpen(true)}
              className="w-full k-control-btn !py-2.5 !text-sm !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] dark:!bg-[#02abb8] dark:hover:!bg-[#028a94]"
            >
              Buy KREX
            </button>
          </div>

          {isVertical ? (
            <div className="hidden xl:flex flex-col gap-1.5 w-2 shrink-0 self-stretch rounded-full overflow-hidden" aria-hidden>
              <div className={`flex-1 ${ui.rail} opacity-90`} />
              <div className={`flex-1 ${ui.rail} opacity-60`} />
              <div className={`flex-1 ${ui.rail} opacity-35`} />
            </div>
          ) : null}
        </div>
      </aside>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
