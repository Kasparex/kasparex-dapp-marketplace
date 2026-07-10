'use client';

import { useMemo, useRef, useState } from 'react';
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

export function StoreDashboardBenefitsPanel({ className = '' }: { className?: string }) {
  const { balance: krexBalance, tier, isLoading } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const stableBalanceRef = useRef(0);
  if (!isLoading) stableBalanceRef.current = krexBalance;
  const displayBalance = isLoading ? stableBalanceRef.current : krexBalance;
  const visualTier = balanceToKrexVisualTier(displayBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;
  const listPts = computeEarnedHubPoints(HUB_EARN_POINTS.storeProductList, tier);
  const tooltipContent = useMemo(() => TIER_TOOLTIP, []);

  return (
    <>
      <aside
        className={`flex flex-col gap-3 rounded-2xl border p-5 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.35)] ${ui.panel} ${className}`.trim()}
      >
        <DAppSectionHeader title="Seller benefits" className="!mb-0" />
        <Tooltip content={tooltipContent}>
          <div className="cursor-help space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-300">
              KREX tier: {tierLabel}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Balance: {formatKrexMillions(displayBalance)} KREX
            </p>
          </div>
        </Tooltip>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Publish a product to earn up to{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{listPts} Hub Points</span>
          {tier !== 'Tier0' ? ` (${formatHubPointsTierLabel(tier)} multiplier)` : ''}.
        </p>
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
        >
          Buy KREX for tier perks
        </button>
      </aside>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
