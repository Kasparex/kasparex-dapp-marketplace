'use client';

import { useState } from 'react';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel, KREX_TIER_PERKS_ROWS } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

type KrexPerkVisualTier = 'none' | 'starter' | 'builder' | 'pro' | 'vip';

function getKrexPerkVisualTier(balance: number): KrexPerkVisualTier {
  if (balance < 1_000_000) return 'none';
  if (balance < 10_000_000) return 'starter';
  if (balance < 50_000_000) return 'builder';
  if (balance < 100_000_000) return 'pro';
  return 'vip';
}

const TIER_UI: Record<
  KrexPerkVisualTier,
  { label: string; panel: string; status: string; statusText: string; accent: string; badge: string }
> = {
  none: {
    label: 'No tier',
    panel:
      'border-zinc-300/80 bg-gradient-to-br from-zinc-100 via-white to-zinc-200/80 dark:border-zinc-500/35 dark:from-zinc-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300',
    statusText: 'Base Hub Points on earn actions. Hold 1M+ KREX for fee discounts and multipliers.',
    accent: 'text-zinc-500 dark:text-zinc-400',
    badge: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200',
  },
  starter: {
    label: 'Tier 1',
    panel:
      'border-orange-300/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/70 dark:border-orange-400/35 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-100',
    statusText: '1M+ KREX. 2% off fees and 1x Hub Points on earn actions.',
    accent: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
  },
  builder: {
    label: 'Tier 2',
    panel:
      'border-yellow-300/80 bg-gradient-to-br from-yellow-50 via-white to-amber-100/70 dark:border-yellow-400/35 dark:from-yellow-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-yellow-300/80 bg-yellow-50 text-yellow-900 dark:border-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-100',
    statusText: '10M+ KREX. 5% off fees and 2x Hub Points.',
    accent: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
  },
  pro: {
    label: 'Tier 3',
    panel:
      'border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-cyan-100/70 dark:border-teal-400/35 dark:from-teal-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-teal-300/80 bg-teal-50 text-teal-900 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-100',
    statusText: '50M+ KREX. 50% off fees and 3x Hub Points.',
    accent: 'text-teal-700 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200',
  },
  vip: {
    label: 'Tier 4',
    panel:
      'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 dark:border-emerald-400/35 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    statusText: '100M+ KREX. 80% off fees and 4x Hub Points.',
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
    <div className="space-y-2 text-left max-w-sm">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">KREX tier perks</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-300/80 dark:border-zinc-600">
            <th className="pb-1 pr-2 text-left font-semibold">KREX held</th>
            <th className="pb-1 pr-2 text-left font-semibold">Fee discount</th>
            <th className="pb-1 text-left font-semibold">Hub Points</th>
          </tr>
        </thead>
        <tbody className="text-zinc-700 dark:text-zinc-300">
          {KREX_TIER_PERKS_ROWS.map((row) => (
            <tr key={row.tier}>
              <td className="py-0.5 pr-2">{row.thresholdLabel}</td>
              <td className="py-0.5 pr-2">
                {row.feeDiscountPercent > 0 ? `${row.feeDiscountPercent}% off` : 'None'}
              </td>
              <td className="py-0.5">{formatHubPointsTierLabel(row.tier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VBlogDashboardBenefitsPanel({ className = '' }: { className?: string }) {
  const pricing = useVBlogPricing();
  const { balance: krexBalance, tier } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

  const discountPercent = pricing.tier.krexDiscountPercent;
  const publishPts = computeEarnedHubPoints(HUB_EARN_POINTS.vblogArticleCreate, tier);

  const visualTier = getKrexPerkVisualTier(krexBalance);
  const ui = TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;

  return (
    <>
      <TooltipProvider>
        <Tooltip content={<CreatorPerksTooltipContent />}>
          <aside
            className={`w-full rounded-xl border p-3.5 shadow-lg cursor-help ${ui.panel} ${className}`.trim()}
            aria-label="Creator perks. Hover for KREX tier details."
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#02abb8] dark:text-[#66dfe8]">
                Creator perks
              </p>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
                {ui.label}
              </span>
            </div>
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
              className="mt-2.5 w-full k-control-btn !py-2 !text-sm !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] dark:!bg-[#02abb8] dark:hover:!bg-[#028a94]"
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
