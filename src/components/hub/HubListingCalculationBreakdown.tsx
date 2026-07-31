'use client';

import { useState } from 'react';
import type { HubListingPriceQuote } from '@/lib/hub/listingPricing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { HubPaymentCurrencyCatalogTrigger } from '@/components/payments/HubPaymentCurrencyCatalogModal';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { TierBadge } from '@/components/rewards/TierBadge';
import { useHubPayWithCatalog } from '@/hooks/useHubPayWithCatalog';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
import { formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import { formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';

type Props = {
  quote: HubListingPriceQuote;
  hubPoints?: number;
  /** Extra note under total (e.g. payment currency hint). */
  footerNote?: string;
  className?: string;
  /** Selected pay currency id (KAS / KREX / token id). */
  selectedCurrencyId?: string;
  onCurrencySelect?: (option: HubPaymentCurrencyOption) => void;
  /** Override catalog; defaults to public verified Hub catalog. */
  catalogEntries?: HubCurrencyCatalogEntry[];
  /** Show Pay with even when parent does not pass handlers (read-only trigger). */
  showPayWith?: boolean;
};

/**
 * Shared Calculation breakdown rail.
 * Matches vBlog Create Article: major blocks separated by gap-4; fee rows use space-y-3.
 * Do not pass className="contents" (collapses spacing against sibling CTAs).
 */
export function HubListingCalculationBreakdown({
  quote,
  hubPoints,
  footerNote,
  className,
  selectedCurrencyId = 'KAS',
  onCurrencySelect,
  catalogEntries: catalogOverride,
  showPayWith = true,
}: Props) {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { catalogEntries: defaultCatalog, pricingSnapshot } = useHubPayWithCatalog({
    amountKas: quote.totalKas,
  });
  const catalogEntries = catalogOverride ?? defaultCatalog;
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const showBuyKrex = quote.discountPercent <= 0 && krexBalance < KREX_TIERS.Tier1.minKREX;

  const selected =
    catalogEntries.find((e) => e.id === selectedCurrencyId) ??
    catalogEntries.find((e) => e.id === 'KAS') ??
    catalogEntries[0];

  const formatFee = (kas: number) =>
    selected
      ? formatHubPaymentAmount(selected, kas, { snapshot: pricingSnapshot })
      : `${kas} KAS`;

  const totalDisplay = selected
    ? formatHubPaymentAmount(selected, quote.totalKas, { snapshot: pricingSnapshot })
    : `${quote.totalKas} KAS`;

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`.trim()}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DAppSectionHeader title="Calculation breakdown" className="!mb-0" />
        <TierBadge tier={tier} isUnlocked={krexBalance > 0} />
      </div>

      <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between gap-2">
          <span>Base fee</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatFee(quote.baseFeeKas)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Size fee</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatFee(quote.sizeFeeKas)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Network buffer</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatFee(quote.networkFeeBufferKas)}
          </span>
        </div>
        {quote.moduleLines.map((line) => (
          <div key={line.id} className="flex justify-between gap-2">
            <span className="truncate">{line.title}</span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              +{formatFee(line.kas)}
            </span>
          </div>
        ))}
        {quote.modulesFeeKas > 0 ? (
          <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <span>Modules subtotal</span>
            <span className="font-semibold tabular-nums text-[color:var(--hub-accent,#02abb8)]">
              {formatFee(quote.modulesFeeKas)}
            </span>
          </div>
        ) : null}
        {quote.discountKas > 0 ? (
          <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <span>Subtotal</span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatFee(quote.subtotalKas)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <span>Payload bytes</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {quote.payloadBytes}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Chunk estimate</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {quote.chunkCount}
          </span>
        </div>
      </div>

      {showPayWith && catalogEntries.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
          <HubPaymentCurrencyCatalogTrigger
            entries={catalogEntries}
            selectedId={selectedCurrencyId}
            onSelect={(option) => onCurrencySelect?.(option)}
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
        <p className="text-2xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">{totalDisplay}</p>
      </div>

      {footerNote ? (
        <div className="rounded-xl border border-[color:var(--hub-accent-border,rgba(2,171,184,0.25))] bg-[color:var(--hub-accent-muted,rgba(2,171,184,0.1))] p-3 text-sm text-zinc-700 dark:text-zinc-300">
          {footerNote}
        </div>
      ) : null}

      {quote.discountKas > 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
          KREX discount: -{formatFee(quote.discountKas)} ({quote.discountPercent}% off total).
        </div>
      ) : null}

      {hubPoints != null && hubPoints > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <span>Hub points on action</span>
          <span className="inline-flex items-center gap-1.5">
            <HubPointsEarnBadge points={hubPoints} baseSpendKas={quote.subtotalKas} />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              ({tier !== 'Tier0' ? `${formatHubPointsTierLabel(tier)} multiplier` : 'base amount'})
            </span>
          </span>
        </div>
      ) : null}

      {showBuyKrex ? (
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
        >
          Buy KREX to unlock discount
        </button>
      ) : null}

      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </div>
  );
}
