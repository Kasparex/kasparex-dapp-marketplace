'use client';

import { useMemo, useRef, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { KREX_TIERS } from '@/lib/rewards/types';
import { balanceToKrexVisualTier, KREX_TIER_UI } from '@/lib/rewards/tierUi';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
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

export function DAppsBenefitsPanel({
  className = '',
  variant = 'panel',
}: {
  className?: string;
  variant?: 'panel' | 'compact';
}) {
  const { balance: krexBalance, tier, isLoading } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const stableBalanceRef = useRef(0);
  if (!isLoading) stableBalanceRef.current = krexBalance;
  const displayBalance = isLoading ? stableBalanceRef.current : krexBalance;
  const discountPercent = krexTierDiscountPercent(tier);
  const visualTier = balanceToKrexVisualTier(displayBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;
  const tooltipContent = useMemo(() => TIER_TOOLTIP, []);

  const buyKrexButtonClass = 'hub-cta-btn shrink-0 k-control-btn !h-auto';

  if (variant === 'compact') {
    const feePerk =
      discountPercent > 0 ? `${discountPercent}% off total` : 'Hold 1M+ KREX for discounts';

    return (
      <>
        <aside
          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-md max-w-full ${ui.panel} ${className}`.trim()}
          aria-label="dApp benefits. Hover for KREX tier details."
        >
          <Tooltip content={tooltipContent}>
            <div className="flex items-center gap-2 min-w-0 cursor-help">
              <span className="hub-benefits-kicker text-xs font-black uppercase tracking-[0.12em] whitespace-nowrap">
                Benefits
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wide whitespace-nowrap ${ui.badge}`}>
                {ui.label}
              </span>
              <span className="hidden md:inline text-[13px] leading-none text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {feePerk}
              </span>
            </div>
          </Tooltip>
          <button type="button" onClick={() => setIsKrexWizardOpen(true)} className={`${buyKrexButtonClass} !py-1 !px-3 !text-xs !font-bold`}>
            Buy KREX
          </button>
        </aside>
        <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Tooltip content={tooltipContent}>
        <aside
          className={`w-full min-w-0 max-w-full cursor-help rounded-xl border p-3.5 shadow-lg ${ui.panel} ${className}`.trim()}
          aria-label="dApp user perks. Hover for KREX tier details."
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
            Hold KREX. Pay less. Earn more.
          </h2>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <span className={ui.accent}>•</span>{' '}
              {discountPercent > 0
                ? `${discountPercent}% off total (${tierLabel})`
                : `Stack 1M+ KREX for ${KREX_TIERS.Tier1.feeDiscountPercent}% off total`}
            </li>
            <li>
              <span className={ui.accent}>•</span> Hub Points on every interaction
            </li>
            <li>
              <span className={ui.accent}>•</span> NFT and NODE perks stack with KREX tier
            </li>
          </ul>
          <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${ui.status}`}>
            <span className="font-semibold">{formatKrexMillions(displayBalance)} KREX held.</span> {ui.statusText}
          </div>
          <button type="button" onClick={() => setIsKrexWizardOpen(true)} className={`mt-2.5 w-full ${buyKrexButtonClass} !py-2 !text-sm`}>
            Buy KREX
          </button>
        </aside>
      </Tooltip>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
