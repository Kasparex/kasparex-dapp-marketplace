'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { KxModalShell } from '@/components/ui/KxModalShell';
import { KxModalHeader } from '@/components/payments/KxPaymentUi';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import { catalogEntryToOption } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

export function HubPaymentCurrencyCatalogModal({
  isOpen,
  onClose,
  entries,
  selectedId,
  onSelect,
  title = 'Pay with',
  subtitle = 'Choose a currency. Unlocked Tokens appear here; KCC-20 assets stay KRON-compatible.',
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <KxModalShell isOpen={isOpen} onClose={onClose} panelClassName="max-w-lg" labelledBy="hub-pay-currency-title">
      <KxModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <div id="hub-pay-currency-title" className="max-h-[min(70vh,520px)] overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No payment currencies available.</p>
        ) : (
          entries.map((entry) => {
            const selected = entry.id === selectedId;
            const locked = entry.status === 'locked';
            const pending = entry.status === 'pay_pending';
            return (
              <div
                key={entry.id}
                className={`rounded-xl border p-3 transition ${
                  selected
                    ? 'border-[color:var(--hub-accent,#02abb8)] bg-[color:var(--hub-accent,#02abb8)]/10'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{entry.label}</p>
                    {entry.detail ? (
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{entry.detail}</p>
                    ) : null}
                    {entry.amountLabel ? (
                      <p className="mt-1 text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {entry.amountLabel}
                      </p>
                    ) : null}
                    {entry.balanceLabel ? (
                      <p className="mt-0.5 text-[11px] text-zinc-500">{entry.balanceLabel}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {locked || pending ? (
                      <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        {locked ? 'Locked' : 'Soon'}
                      </span>
                    ) : null}
                    {!locked ? (
                      <button
                        type="button"
                        className="k-control-btn text-xs hub-sidebar-action-active"
                        onClick={() => {
                          onSelect(catalogEntryToOption(entry));
                          onClose();
                        }}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </button>
                    ) : null}
                    {entry.actionHref ? (
                      <Link
                        href={entry.actionHref}
                        target={entry.actionHref.startsWith('http') ? '_blank' : undefined}
                        rel={entry.actionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-[11px] font-medium text-[color:var(--hub-accent,#02abb8)] hover:underline"
                      >
                        {entry.actionLabel ?? 'Open'}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </KxModalShell>
  );
}

/** Compact trigger used inside Calculation / payment rails. */
export function HubPaymentCurrencyCatalogTrigger({
  entries,
  selectedId,
  onSelect,
  accent = 'default',
  className,
}: {
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  accent?: 'default' | 'store';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  if (entries.length <= 1 && !entries.some((e) => e.status === 'locked')) {
    return selected ? (
      <p className={`text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 ${className ?? ''}`}>
        {selected.label}
      </p>
    ) : null;
  }

  const accentClass =
    accent === 'store'
      ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
      : 'border-[color:var(--hub-accent,#02abb8)]/40 text-zinc-900 dark:text-zinc-100';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`k-control-btn w-full justify-between text-sm ${accentClass} ${className ?? ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label ?? 'Select currency'}</span>
        <span className="text-xs text-zinc-500 shrink-0">Change</span>
      </button>
      <HubPaymentCurrencyCatalogModal
        isOpen={open}
        onClose={() => setOpen(false)}
        entries={entries}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </>
  );
}
