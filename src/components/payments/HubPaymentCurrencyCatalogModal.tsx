'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KxModalShell } from '@/components/ui/KxModalShell';
import { KxModalHeader } from '@/components/payments/KxPaymentUi';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import { catalogEntryToOption } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

function entryMatchesQuery(entry: HubCurrencyCatalogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    entry.label,
    entry.tick,
    entry.id,
    entry.detail,
    entry.searchText,
    entry.covenantId,
    entry.kind,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function HubPaymentCurrencyCatalogModal({
  isOpen,
  onClose,
  entries,
  selectedId,
  onSelect,
  title = 'Select currency',
  subtitle = 'Search Hub currencies. Deployer-verified Tokens (KRC-20 and KCC-20) are available to everyone.',
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  title?: string;
  subtitle?: string;
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const filtered = useMemo(
    () => entries.filter((entry) => entryMatchesQuery(entry, query)),
    [entries, query],
  );

  const builtins = filtered.filter((e) => e.kind === 'kas' || e.kind === 'krex');
  const tokens = filtered.filter((e) => e.kind !== 'kas' && e.kind !== 'krex');

  return (
    <KxModalShell isOpen={isOpen} onClose={onClose} panelClassName="max-w-lg" labelledBy="hub-pay-currency-title">
      <KxModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <div className="border-b border-zinc-200 px-4 sm:px-6 py-3 dark:border-zinc-800">
        <label className="sr-only" htmlFor="hub-pay-currency-search">
          Search currencies
        </label>
        <input
          id="hub-pay-currency-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ticker, or covenant…"
          className="k-input w-full text-sm"
          autoFocus
        />
      </div>
      <div id="hub-pay-currency-title" className="max-h-[min(70vh,520px)] overflow-y-auto px-4 sm:px-6 py-3 space-y-4">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            No currencies match “{query.trim()}”.
          </p>
        ) : (
          <>
            {builtins.length > 0 ? (
              <section className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Network</p>
                {builtins.map((entry) => (
                  <CurrencyRow
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === selectedId}
                    onSelect={() => {
                      onSelect(catalogEntryToOption(entry));
                      onClose();
                    }}
                  />
                ))}
              </section>
            ) : null}
            {tokens.length > 0 ? (
              <section className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Tokens</p>
                {tokens.map((entry) => (
                  <CurrencyRow
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === selectedId}
                    onSelect={() => {
                      if (entry.status === 'locked') return;
                      onSelect(catalogEntryToOption(entry));
                      onClose();
                    }}
                  />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </KxModalShell>
  );
}

function CurrencyRow({
  entry,
  selected,
  onSelect,
}: {
  entry: HubCurrencyCatalogEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const locked = entry.status === 'locked';
  const pending = entry.status === 'pay_pending';

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? 'border-[color:var(--hub-accent,#02abb8)] bg-[color:var(--hub-accent,#02abb8)]/10'
          : 'border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-zinc-600'
      } ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <div className="min-w-0 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[10px] font-bold uppercase text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
          aria-hidden
        >
          {(entry.tick ?? entry.label).slice(0, 3)}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{entry.label}</p>
          {entry.detail ? (
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{entry.detail}</p>
          ) : null}
          {entry.amountLabel ? (
            <p className="mt-0.5 text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
              {entry.amountLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {locked || pending ? (
          <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {locked ? 'Locked' : 'Soon'}
          </span>
        ) : selected ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--hub-accent,#02abb8)]">
            Selected
          </span>
        ) : null}
        {entry.actionHref ? (
          <Link
            href={entry.actionHref}
            target={entry.actionHref.startsWith('http') ? '_blank' : undefined}
            rel={entry.actionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-medium text-[color:var(--hub-accent,#02abb8)] hover:underline"
          >
            {entry.actionLabel ?? 'Open'}
          </Link>
        ) : null}
      </div>
    </button>
  );
}

/** Compact trigger used inside Calculation / payment rails. */
export function HubPaymentCurrencyCatalogTrigger({
  entries,
  selectedId,
  onSelect,
  accent = 'default',
  className,
  /** Always show the Pay with control even when only one currency exists. */
  alwaysShow = true,
}: {
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  accent?: 'default' | 'store';
  className?: string;
  alwaysShow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries.find((e) => e.status === 'available') ?? entries[0],
    [entries, selectedId],
  );

  if (!alwaysShow && entries.length <= 1 && !entries.some((e) => e.status === 'locked')) {
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
        <span className="truncate inline-flex items-center gap-2 min-w-0">
          <span className="font-semibold">{selected?.label ?? 'Select currency'}</span>
          {selected?.detail ? (
            <span className="truncate text-xs font-normal text-zinc-500">{selected.detail}</span>
          ) : null}
        </span>
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
