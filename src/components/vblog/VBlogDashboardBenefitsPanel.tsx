'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getVBlogBaseFeeKas } from '@/lib/vblog/pricing';

type KrexPerkVisualTier = 'none' | 'starter' | 'builder' | 'vip';

function getKrexPerkVisualTier(balance: number): KrexPerkVisualTier {
  if (balance <= 0) return 'none';
  if (balance < 1_000_000) return 'starter';
  if (balance < 10_000_000) return 'builder';
  return 'vip';
}

const TIER_UI: Record<
  KrexPerkVisualTier,
  { label: string; panel: string; status: string; statusText: string; accent: string }
> = {
  none: {
    label: 'No KREX',
    panel: 'border-zinc-400/35 bg-gradient-to-br from-zinc-500/10 via-zinc-900 to-zinc-800/40',
    status: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    statusText: 'Hold KREX to unlock fee discounts and creator perks.',
    accent: 'text-zinc-400',
  },
  starter: {
    label: 'Starter',
    panel: 'border-orange-400/35 bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-800/40',
    status: 'border-orange-400/30 bg-orange-500/10 text-orange-100',
    statusText: 'Under 1M KREX. Stack more to climb perk tiers.',
    accent: 'text-orange-400',
  },
  builder: {
    label: 'Builder',
    panel: 'border-yellow-400/35 bg-gradient-to-br from-yellow-500/10 via-zinc-900 to-zinc-800/40',
    status: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-100',
    statusText: '1M+ KREX. You are building toward the 10M discount tier.',
    accent: 'text-yellow-400',
  },
  vip: {
    label: 'VIP',
    panel: 'border-emerald-400/35 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-800/40',
    status: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    statusText: '10M+ KREX. Your vBlog fee discount is active.',
    accent: 'text-emerald-400',
  },
};

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function VBlogDashboardBenefitsPanel() {
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

  return (
    <>
      <aside className={`w-full xl:w-[280px] shrink-0 rounded-xl border p-3.5 shadow-lg ${ui.panel}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#02abb8]">Creator perks</p>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.status}`}>
            {ui.label}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-bold text-zinc-100 leading-snug">Hold KREX. Pay less.</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          <li><span className={ui.accent}>•</span> Up to {discountPercent || 80}% off publish fees (10M+ KREX)</li>
          <li><span className={ui.accent}>•</span> +{HUB_EARN_POINTS.vblogArticleCreate} pts publish / +{HUB_EARN_POINTS.vblogArticleUpdate} update</li>
        </ul>
        <div className={`mt-2.5 rounded-lg border px-2.5 py-2 text-[11px] leading-snug ${ui.status}`}>
          <span className="font-semibold">{formatKrexMillions(krexBalance)} KREX held.</span>{' '}
          {ui.statusText}
        </div>
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="mt-2.5 w-full k-control-btn !py-2 !text-xs !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
        >
          Buy KREX
        </button>
      </aside>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
