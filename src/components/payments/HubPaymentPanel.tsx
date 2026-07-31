'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { HubPaymentCurrencyCatalogTrigger } from '@/components/payments/HubPaymentCurrencyCatalogModal';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';
import {
  getHubFlowPreset,
  type HubFlowPresetKey,
  type HubFlowStep,
} from '@/lib/hub/hubFlowProgress';
import {
  buildHubCurrencyCatalog,
  type HubCurrencyCatalogEntry,
} from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption, HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import type { PaymentLeg } from '@/lib/payments/paymentPlan';
import type { KREXTier } from '@/lib/rewards/types';

export function HubPaymentPanel({
  title = 'Calculation breakdown',
  lines,
  totalLabel,
  totalDisplay,
  totalSubtitle,
  currencies,
  selectedCurrencyId,
  onCurrencyChange,
  /** Prefer catalog modal (KAS/KREX/KRC-20/KCC-20 + locked unlock rows). */
  catalogEntries,
  onCatalogSelect,
  currencyPicker = 'catalog',
  splitLegs,
  discountNote,
  infoText,
  tier,
  krexBalance = 0,
  footer,
  className = '',
  asideClassName,
  currencyAccent = 'default',
  infoAccent = 'default',
  requirementsNote,
  hubPoints,
  hubPointsDetail,
  hubPointsBaseSpendKas,
  flowSteps,
  flowPreset = 'hubPublish',
  flowBusy = false,
  flowComplete = false,
  flowActiveStepId = null,
  flowCurrentIndex,
  hideFlowProgress = false,
  alerts,
}: {
  title?: string;
  lines: HubPaymentQuoteLine[];
  totalLabel?: string;
  totalDisplay: string;
  totalSubtitle?: string;
  currencies?: HubPaymentCurrencyOption[];
  selectedCurrencyId?: string;
  onCurrencyChange?: (id: string) => void;
  catalogEntries?: HubCurrencyCatalogEntry[];
  onCatalogSelect?: (option: HubPaymentCurrencyOption) => void;
  currencyPicker?: 'catalog' | 'dropdown';
  /** When set, shows how the KAS payment splits across addresses. */
  splitLegs?: PaymentLeg[];
  discountNote?: string;
  infoText?: string;
  tier?: KREXTier;
  krexBalance?: number;
  footer?: ReactNode;
  alerts?: ReactNode;
  className?: string;
  asideClassName?: string;
  currencyAccent?: 'default' | 'store';
  infoAccent?: 'default' | 'emerald';
  requirementsNote?: string[];
  hubPoints?: number;
  hubPointsDetail?: string;
  hubPointsBaseSpendKas?: number;
  flowSteps?: HubFlowStep[];
  flowPreset?: HubFlowPresetKey;
  flowBusy?: boolean;
  flowComplete?: boolean;
  flowActiveStepId?: string | null;
  flowCurrentIndex?: number;
  hideFlowProgress?: boolean;
}) {
  const steps = flowSteps ?? getHubFlowPreset(flowPreset);

  const resolvedCatalog = useMemo(() => {
    if (catalogEntries?.length) return catalogEntries;
    if (currencies?.length) {
      return buildHubCurrencyCatalog({
        includeKasKrex: false,
        integratedTokens: currencies
          .filter((c) => c.kind === 'krc20' && c.tick)
          .map((c) => ({
            tick: c.tick!,
            decimals: c.decimals ?? 8,
            symbol: c.label,
            listingSlug: c.id,
          })),
        kcc20Tokens: currencies
          .filter((c) => c.kind === 'kcc20' && c.covenantId)
          .map((c) => ({
            id: c.id,
            label: c.label,
            covenantId: c.covenantId!,
            decimals: c.decimals,
            ticker: c.tick,
          })),
      }).concat(
        currencies
          .filter((c) => c.kind === 'kas' || c.kind === 'krex')
          .map((c) => ({ ...c, status: 'available' as const })),
      );
    }
    return [];
  }, [catalogEntries, currencies]);

  const showCatalog =
    currencyPicker === 'catalog' &&
    resolvedCatalog.length > 0 &&
    selectedCurrencyId &&
    (onCatalogSelect || onCurrencyChange);

  const showDropdown =
    currencyPicker === 'dropdown' &&
    currencies &&
    currencies.length > 1 &&
    selectedCurrencyId &&
    onCurrencyChange;

  return (
    <aside className={`${asideClassName ?? KX_CALCULATION_ASIDE} ${className}`.trim()}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DAppSectionHeader title={title} className="!mb-0" />
        {tier != null ? <TierBadge tier={tier} isUnlocked={krexBalance > 0} /> : null}
      </div>

      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        {lines.map((line) => (
          <div
            key={line.label}
            className={`flex justify-between gap-2${line.dividerBefore ? ' border-t border-zinc-200 dark:border-zinc-700 pt-1.5' : ''}`}
          >
            <span className="truncate">{line.label}</span>
            <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {line.value}
            </span>
          </div>
        ))}
      </div>

      {showCatalog || showDropdown || (splitLegs && splitLegs.length > 0) ? (
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700 space-y-3">
          {showCatalog ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
              <HubPaymentCurrencyCatalogTrigger
                entries={resolvedCatalog}
                selectedId={selectedCurrencyId}
                accent={currencyAccent}
                onSelect={(option) => {
                  if (onCatalogSelect) onCatalogSelect(option);
                  else onCurrencyChange?.(option.id);
                }}
              />
            </div>
          ) : null}

          {showDropdown ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
              <HubPaymentCurrencyDropdown
                value={selectedCurrencyId}
                onChange={onCurrencyChange}
                options={currencies.map((c) => ({ value: c.id, label: c.label }))}
                ariaLabel="Payment currency"
                accent={currencyAccent}
              />
            </div>
          ) : null}

          {splitLegs && splitLegs.length > 0 ? (
            <div
              className={`space-y-1.5${showCatalog || showDropdown ? ' border-t border-zinc-200 pt-3 dark:border-zinc-700' : ''}`}
            >
              <p className="text-xs uppercase tracking-widest text-zinc-500">Payment split</p>
              {splitLegs.map((leg) => (
                <div
                  key={`${leg.role}-${leg.address}`}
                  className="flex justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  <span className="truncate">{leg.label ?? leg.role}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {leg.amount} KAS
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-zinc-500">
                One transaction when paying with KAS. Token / KREX rails add a second Hub KAS fee
                step. Change returns to your wallet.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-500">{totalLabel ?? 'Total to pay'}</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{totalDisplay}</p>
        {totalSubtitle ? (
          <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">{totalSubtitle}</p>
        ) : null}
      </div>

      {discountNote ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
          {discountNote}
        </div>
      ) : null}

      {infoText ? (
        <div
          className={`rounded-xl border p-3 text-sm text-zinc-700 dark:text-zinc-300 ${
            infoAccent === 'emerald'
              ? 'border-emerald-500/25 bg-emerald-500/10'
              : 'border-[#02abb8]/25 bg-[#02abb8]/10'
          }`}
        >
          {infoText}
        </div>
      ) : null}

      {requirementsNote && requirementsNote.length > 0 ? (
        <div className="rounded-xl border border-amber-300/60 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/30 p-3 text-sm text-amber-950 dark:text-amber-100 space-y-2">
          <p className="font-semibold">Required before you can pay:</p>
          <ul className="list-disc pl-5 space-y-1">
            {requirementsNote.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hubPoints != null && hubPoints > 0 ? (
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Hub points on action</span>
          <span className="inline-flex items-center gap-1.5">
            <HubPointsEarnBadge points={hubPoints} baseSpendKas={hubPointsBaseSpendKas} />
            {hubPointsDetail ? (
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                ({hubPointsDetail})
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      {footer ? <div className="space-y-3">{footer}</div> : null}

      {alerts ? <div className="space-y-2">{alerts}</div> : null}

      {!hideFlowProgress ? (
        <HubFlowProgress
          steps={steps}
          currentIndex={flowCurrentIndex}
          busy={flowBusy}
          complete={flowComplete}
          activeStepId={flowActiveStepId}
        />
      ) : null}
    </aside>
  );
}
