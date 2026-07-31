'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KxModalShell } from '@/components/ui/KxModalShell';
import { KxModalHeader } from '@/components/payments/KxPaymentUi';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import { catalogEntryToOption } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

type NetworkFilter = 'all' | 'kaspa_l1' | 'l2';
type DexFilter = 'all' | 'native' | 'kron' | 'kaspacom' | 'zealous';

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
    entry.networkTag,
    entry.dexTag,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
        active
          ? 'border-[color:var(--hub-accent,#02abb8)] bg-[color:var(--hub-accent,#02abb8)]/15 text-[color:var(--hub-accent,#02abb8)]'
          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {label}
    </button>
  );
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
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [dexFilter, setDexFilter] = useState<DexFilter>('all');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setNetworkFilter('all');
      setDexFilter('all');
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (!entryMatchesQuery(entry, query)) return false;
      if (networkFilter !== 'all' && (entry.networkTag ?? 'kaspa_l1') !== networkFilter) return false;
      if (dexFilter !== 'all' && (entry.dexTag ?? 'other') !== dexFilter) return false;
      return true;
    });
  }, [entries, query, networkFilter, dexFilter]);

  const nativeKas = filtered.filter((e) => e.kind === 'kas');
  const tokenRows = filtered.filter((e) => e.kind !== 'kas');

  return (
    <KxModalShell isOpen={isOpen} onClose={onClose} panelClassName="max-w-lg" labelledBy="hub-pay-currency-title">
      <KxModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <div className="space-y-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
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
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Network</span>
            <FilterChip label="All" active={networkFilter === 'all'} onClick={() => setNetworkFilter('all')} />
            <FilterChip
              label="Kaspa L1"
              active={networkFilter === 'kaspa_l1'}
              onClick={() => setNetworkFilter('kaspa_l1')}
            />
            <FilterChip label="L2" active={networkFilter === 'l2'} onClick={() => setNetworkFilter('l2')} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">DEX</span>
            <FilterChip label="All" active={dexFilter === 'all'} onClick={() => setDexFilter('all')} />
            <FilterChip label="Native" active={dexFilter === 'native'} onClick={() => setDexFilter('native')} />
            <FilterChip label="KRON" active={dexFilter === 'kron'} onClick={() => setDexFilter('kron')} />
            <FilterChip
              label="KaspaCom"
              active={dexFilter === 'kaspacom'}
              disabled
              onClick={() => setDexFilter('kaspacom')}
            />
            <FilterChip
              label="Zealous"
              active={dexFilter === 'zealous'}
              disabled
              onClick={() => setDexFilter('zealous')}
            />
          </div>
        </div>
      </div>
      <div id="hub-pay-currency-title" className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-4 py-3 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            No currencies match your search or filters.
          </p>
        ) : (
          <>
            {nativeKas.length > 0 ? (
              <section className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Network</p>
                {nativeKas.map((entry) => (
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
            {tokenRows.length > 0 ? (
              <section className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Tokens</p>
                {tokenRows.map((entry) => (
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
      <div className="flex min-w-0 items-center gap-3">
        {entry.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-600"
          />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[10px] font-bold uppercase text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            aria-hidden
          >
            {(entry.tick ?? entry.label).slice(0, 3)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{entry.label}</p>
          {entry.detail ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{entry.detail}</p>
          ) : null}
          {entry.balanceLabel ? (
            <p className="mt-0.5 text-xs text-zinc-500">Balance {entry.balanceLabel}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {entry.amountLabel ? (
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{entry.amountLabel}</span>
        ) : locked || pending ? (
          <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {locked ? 'Locked' : 'Soon'}
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
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          <span className="font-semibold">{selected?.label ?? 'Select currency'}</span>
          {selected?.amountLabel ? (
            <span className="truncate text-xs font-normal text-zinc-500">{selected.amountLabel}</span>
          ) : selected?.detail ? (
            <span className="truncate text-xs font-normal text-zinc-500">{selected.detail}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs text-zinc-500">Change</span>
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
