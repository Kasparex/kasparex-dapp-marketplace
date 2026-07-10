'use client';

import type { ReactNode } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';
import type { HubPaymentCurrencyOption, HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import type { KREXTier } from '@/lib/rewards/types';

export function HubPaymentPanel({
  title = 'Calculation breakdown',
  lines,
  totalLabel,
  totalDisplay,
  currencies,
  selectedCurrencyId,
  onCurrencyChange,
  discountNote,
  infoText,
  tier,
  krexBalance = 0,
  footer,
  className = '',
}: {
  title?: string;
  lines: HubPaymentQuoteLine[];
  totalLabel?: string;
  totalDisplay: string;
  currencies?: HubPaymentCurrencyOption[];
  selectedCurrencyId?: string;
  onCurrencyChange?: (id: string) => void;
  discountNote?: string;
  infoText?: string;
  tier?: KREXTier;
  krexBalance?: number;
  footer?: ReactNode;
  className?: string;
}) {
  const showCurrency =
    currencies && currencies.length > 1 && selectedCurrencyId && onCurrencyChange;

  return (
    <aside className={`${KX_CALCULATION_ASIDE} ${className}`.trim()}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DAppSectionHeader title={title} className="!mb-0" />
        {tier != null ? <TierBadge tier={tier} isUnlocked={krexBalance > 0} /> : null}
      </div>

      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-2">
            <span className="truncate">{line.label}</span>
            <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {line.value}
            </span>
          </div>
        ))}
      </div>

      {showCurrency ? (
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
          <HubPaymentCurrencyDropdown
            value={selectedCurrencyId}
            onChange={onCurrencyChange}
            options={currencies.map((c) => ({ value: c.id, label: c.label }))}
            ariaLabel="Payment currency"
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-500">{totalLabel ?? 'Total to pay'}</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{totalDisplay}</p>
      </div>

      {discountNote ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
          {discountNote}
        </div>
      ) : null}

      {infoText ? (
        <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
          {infoText}
        </div>
      ) : null}

      {footer ? <div className="space-y-3">{footer}</div> : null}
    </aside>
  );
}
