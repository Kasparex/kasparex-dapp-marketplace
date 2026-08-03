'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KxModalShell } from '@/components/ui/KxModalShell';
import { KxModalHeader } from '@/components/payments/KxPaymentUi';
import { Tooltip } from '@/components/ui/Tooltip';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import type { HubCurrencyCatalogEntry } from '@/lib/payments/currencyCatalog';
import { catalogEntryToOption } from '@/lib/payments/currencyCatalog';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';
import { formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import { prefetchImageUrls } from '@/lib/hub/aggressiveCache';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import type { PricingSnapshot } from '@/lib/pricing/types';

type NetworkFilter = 'all' | 'kcc20_l1' | 'krc20_l1' | 'kasplex_l2' | 'igra_l2';
type DexFilter = 'all' | 'kron' | 'kcom' | 'zealous';

const BUY_KAS_URL = 'https://kaspa.org/hodl#buy';
const INTEGRATE_TOKEN_TOOLTIP =
  'If you are a token creator on Kaspa, you can integrate your token into Kasparex Hub.';

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
  onRefreshRates,
  isRefreshingRates = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  title?: string;
  subtitle?: string;
  /** Clears Hub FX cache and reloads KasLab market rates globally. */
  onRefreshRates?: () => void | Promise<void>;
  isRefreshingRates?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [dexFilter, setDexFilter] = useState<DexFilter>('all');
  const [krexBuyOpen, setKrexBuyOpen] = useState(false);

  const pricingTickers = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((e) => (e.tick || e.id || '').trim().toUpperCase())
            .filter((t) => t && t !== 'KAS' && !t.startsWith('KCC20:')),
        ),
      ),
    [entries],
  );
  const { refresh: refreshPricing, isRefreshing: hookRefreshing } = usePricingSnapshot(
    pricingTickers.length ? pricingTickers : ['KREX'],
  );
  const refreshing = isRefreshingRates || hookRefreshing;

  const handleRefreshRates = async () => {
    if (onRefreshRates) {
      await onRefreshRates();
      return;
    }
    await refreshPricing();
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setNetworkFilter('all');
      setDexFilter('all');
      return;
    }
    prefetchImageUrls(entries.map((entry) => entry.imageUrl));
  }, [isOpen, entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (!entryMatchesQuery(entry, query)) return false;
      if (networkFilter !== 'all' && entry.networkTag !== networkFilter) return false;
      if (dexFilter !== 'all' && (entry.dexTag ?? 'other') !== dexFilter) return false;
      return true;
    });
  }, [entries, query, networkFilter, dexFilter]);

  const nativeKas = filtered.filter((e) => e.kind === 'kas');
  const tokenRows = filtered.filter((e) => e.kind !== 'kas');

  return (
    <>
      <KxModalShell
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="max-w-lg flex max-h-[min(90vh,640px)] flex-col"
        labelledBy="hub-pay-currency-title"
      >
        <KxModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          actions={
            <Tooltip content="Refresh Hub market conversion rates (clears cached FX)">
              <button
                type="button"
                onClick={() => void handleRefreshRates()}
                disabled={refreshing}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                aria-label="Refresh currency prices"
              >
                <svg
                  className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </Tooltip>
          }
        />
        <div className="shrink-0 space-y-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
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
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Network
              </span>
              <FilterChip label="All" active={networkFilter === 'all'} onClick={() => setNetworkFilter('all')} />
              <FilterChip
                label="KCC20 L1"
                active={networkFilter === 'kcc20_l1'}
                onClick={() => setNetworkFilter('kcc20_l1')}
              />
              <FilterChip
                label="KRC20 L1"
                active={networkFilter === 'krc20_l1'}
                onClick={() => setNetworkFilter('krc20_l1')}
              />
              <FilterChip
                label="KASPLEX L2"
                active={networkFilter === 'kasplex_l2'}
                onClick={() => setNetworkFilter('kasplex_l2')}
              />
              <FilterChip
                label="IGRA L2"
                active={networkFilter === 'igra_l2'}
                onClick={() => setNetworkFilter('igra_l2')}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">DEX</span>
              <FilterChip label="ALL" active={dexFilter === 'all'} onClick={() => setDexFilter('all')} />
              <FilterChip label="KRON" active={dexFilter === 'kron'} onClick={() => setDexFilter('kron')} />
              <FilterChip label="KCOM" active={dexFilter === 'kcom'} onClick={() => setDexFilter('kcom')} />
              <FilterChip label="ZEALOUS" active={dexFilter === 'zealous'} onClick={() => setDexFilter('zealous')} />
            </div>
          </div>
        </div>
        <div
          id="hub-pay-currency-title"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3 sm:px-6"
        >
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
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={BUY_KAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="k-control-btn inline-flex items-center gap-1.5 text-xs"
              title="Opens in a new tab"
            >
              Buy KAS
              <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="k-control-btn text-xs" onClick={() => setKrexBuyOpen(true)}>
              Buy KREX
            </button>
          </div>
          <Tooltip content={INTEGRATE_TOKEN_TOOLTIP}>
            <Link href="/tokens/dashboard" className="k-control-btn text-xs" onClick={onClose}>
              Integrate token
            </Link>
          </Tooltip>
        </div>
      </KxModalShell>
      <KREXBuyWizard isOpen={krexBuyOpen} onClose={() => setKrexBuyOpen(false)} />
    </>
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
  const disabled = locked || pending;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? 'border-[color:var(--hub-accent,#02abb8)] bg-[color:var(--hub-accent,#02abb8)]/10'
          : 'border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-zinc-600'
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
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
            {locked ? 'Locked' : 'No rate'}
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

/** Compact trigger used inside Calculation / payment rails.
 * LOCKED Hub face: currency icon + amount (or ticker) + chevron.
 * Never show network/detail subtitles on this button.
 */
export function HubPaymentCurrencyCatalogTrigger({
  entries,
  selectedId,
  onSelect,
  accent = 'default',
  className,
  /** Always show the Pay with control even when only one currency exists. */
  alwaysShow = true,
  /**
   * KAS-equivalent total for the current quote. When set, the button face shows
   * the converted amount even if catalog entries were built without amountLabel.
   */
  amountKas,
  pricingSnapshot,
}: {
  entries: HubCurrencyCatalogEntry[];
  selectedId?: string;
  onSelect: (option: HubPaymentCurrencyOption) => void;
  accent?: 'default' | 'store';
  className?: string;
  alwaysShow?: boolean;
  amountKas?: number | null;
  pricingSnapshot?: PricingSnapshot | null;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries.find((e) => e.status === 'available') ?? entries[0],
    [entries, selectedId],
  );

  const faceAmount = useMemo(() => {
    if (selected?.amountLabel?.trim()) return selected.amountLabel.trim();
    if (selected && amountKas != null && Number.isFinite(amountKas) && amountKas > 0) {
      return formatHubPaymentAmount(selected, amountKas, { snapshot: pricingSnapshot });
    }
    return selected?.label?.trim() || 'Select currency';
  }, [selected, amountKas, pricingSnapshot]);

  if (!alwaysShow && entries.length <= 1 && !entries.some((e) => e.status === 'locked')) {
    return selected ? (
      <p className={`text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 ${className ?? ''}`}>
        {faceAmount}
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
        className={`k-control-btn h-10 w-full justify-between text-sm ${accentClass} ${className ?? ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          {selected?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-600"
            />
          ) : selected ? (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[9px] font-bold uppercase text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
              aria-hidden
            >
              {(selected.tick ?? selected.label).slice(0, 3)}
            </span>
          ) : null}
          <span className="truncate font-semibold tabular-nums">{faceAmount}</span>
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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
