'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getVBlogBaseFeeKas } from '@/lib/vblog/pricing';

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
  const discountKas = Math.max(0, fullBaseFee - sampleQuote.baseFeeKas);
  const discountPercent = fullBaseFee > 0 ? Math.round((discountKas / fullBaseFee) * 100) : 0;

  return (
    <>
      <aside className="w-full xl:max-w-sm shrink-0 rounded-2xl border border-[#02abb8]/30 bg-gradient-to-br from-[#02abb8]/10 via-white to-emerald-500/5 dark:from-[#02abb8]/15 dark:via-zinc-900 dark:to-emerald-500/10 p-5 shadow-[0_12px_40px_-20px_rgba(2,171,184,0.55)]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#02abb8]">Creator perks</p>
        <h2 className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-100 leading-snug">
          Hold KREX. Pay less. Earn more.
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-2">
            <span className="text-[#02abb8] font-black">+</span>
            <span>KREX holders unlock up to {discountPercent || 80}% off vBlog base fees.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#02abb8] font-black">+</span>
            <span>Publish an article and earn <strong>{HUB_EARN_POINTS.vblogArticleCreate} Hub Points</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#02abb8] font-black">+</span>
            <span>Updates earn <strong>{HUB_EARN_POINTS.vblogArticleUpdate} Hub Points</strong> when verified on-chain.</span>
          </li>
        </ul>
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          {pricing.tier.hasKREXDiscount ? (
            <span>Your KREX discount is active. You save on every publish.</span>
          ) : (
            <span>
              You hold {(krexBalance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M KREX.
              Hold 10M+ KREX to unlock the discount tier.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="mt-4 w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
        >
          Buy KREX
        </button>
      </aside>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
