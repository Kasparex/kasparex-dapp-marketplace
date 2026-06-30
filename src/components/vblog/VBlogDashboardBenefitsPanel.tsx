'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

type KrexPerkVisualTier = 'none' | 'starter' | 'builder' | 'vip';

function getKrexPerkVisualTier(balance: number): KrexPerkVisualTier {
  if (balance <= 0) return 'none';
  if (balance < 1_000_000) return 'starter';
  if (balance < 10_000_000) return 'builder';
  return 'vip';
}

const TIER_UI: Record<
  KrexPerkVisualTier,
  { label: string; panel: string; status: string; statusText: string; accent: string; badge: string }
> = {
  none: {
    label: 'No KREX',
    panel:
      'border-zinc-300/80 bg-gradient-to-br from-zinc-100 via-white to-zinc-200/80 dark:border-zinc-500/35 dark:from-zinc-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300',
    statusText: 'Hold KREX to unlock fee discounts and creator perks.',
    accent: 'text-zinc-500 dark:text-zinc-400',
    badge: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200',
  },
  starter: {
    label: 'Starter',
    panel:
      'border-orange-300/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/70 dark:border-orange-400/35 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-100',
    statusText: 'Under 1M KREX. Stack more to climb perk tiers.',
    accent: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
  },
  builder: {
    label: 'Builder',
    panel:
      'border-yellow-300/80 bg-gradient-to-br from-yellow-50 via-white to-amber-100/70 dark:border-yellow-400/35 dark:from-yellow-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-yellow-300/80 bg-yellow-50 text-yellow-900 dark:border-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-100',
    statusText: '1M+ KREX. You are building toward the 10M discount tier.',
    accent: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
  },
  vip: {
    label: 'VIP',
    panel:
      'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 dark:border-emerald-400/35 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    statusText: '10M+ KREX. Your vBlog fee discount is active.',
    accent: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
};

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function CreatorPerksTooltipContent() {
  return (
    <div className="space-y-2 text-left max-w-xs">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">KREX creator perks</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-300/80 dark:border-zinc-600">
            <th className="pb-1 pr-2 text-left font-semibold">KREX held</th>
            <th className="pb-1 text-left font-semibold">vBlog fee discount</th>
          </tr>
        </thead>
        <tbody className="text-zinc-700 dark:text-zinc-300">
          <tr>
            <td className="py-0.5 pr-2">0</td>
            <td className="py-0.5">Standard fees</td>
          </tr>
          <tr>
            <td className="py-0.5 pr-2">1M+</td>
            <td className="py-0.5">Builder tier perks</td>
          </tr>
          <tr>
            <td className="py-0.5 pr-2">10M+</td>
            <td className="py-0.5">Up to 80% off total fees</td>
          </tr>
        </tbody>
      </table>
      <ul className="list-disc space-y-0.5 pl-4 text-xs text-zinc-700 dark:text-zinc-300">
        <li>Publish: +{HUB_EARN_POINTS.vblogArticleCreate} Hub Points</li>
        <li>Update: +{HUB_EARN_POINTS.vblogArticleUpdate} Hub Points</li>
      </ul>
    </div>
  );
}

function CreatorPerksInfoButton() {
  return (
    <Tooltip content={<CreatorPerksTooltipContent />}>
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-[#02abb8] hover:bg-[#02abb8]/10 transition-colors"
        aria-label="View KREX discount tiers"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  );
}

export function VBlogDashboardBenefitsPanel({ className = '' }: { className?: string }) {
  const pricing = useVBlogPricing();
  const { balance: krexBalance } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

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
  const discountPercent =
    sampleQuote.subtotalKas > 0
      ? Math.round((sampleQuote.discountKas / sampleQuote.subtotalKas) * 100)
      : 0;

  const visualTier = getKrexPerkVisualTier(krexBalance);
  const ui = TIER_UI[visualTier];

  return (
    <>
      <TooltipProvider>
        <aside
          className={`w-full rounded-xl border p-3.5 shadow-lg ${ui.panel} ${className}`.trim()}
          aria-label="Creator perks"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#02abb8] dark:text-[#66dfe8]">
                Creator perks
              </p>
              <CreatorPerksInfoButton />
            </div>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
              {ui.label}
            </span>
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-2.5">
            Hold KREX. Pay Less. Earn More.
          </h2>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <span className={ui.accent}>•</span> Up to {discountPercent || 80}% off publish fees (10M+ KREX)
            </li>
          </ul>
          <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${ui.status}`}>
            <span className="font-semibold">{formatKrexMillions(krexBalance)} KREX held.</span>{' '}
            {ui.statusText}
          </div>
          <button
            type="button"
            onClick={() => setIsKrexWizardOpen(true)}
            className="mt-2.5 w-full k-control-btn !py-2 !text-sm !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] dark:!bg-[#02abb8] dark:hover:!bg-[#028a94]"
          >
            Buy KREX
          </button>
        </aside>
      </TooltipProvider>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
