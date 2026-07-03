'use client';

import { useEffect, useState } from 'react';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { fetchKrc20TokenInfo, formatKrc20Supply, type Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';

interface Krc20TickerSearchFieldProps {
  value: string;
  onChange: (tick: string) => void;
  onSelect: (info: Krc20TokenInfo | null) => void;
  disabled?: boolean;
  selected?: Krc20TokenInfo | null;
}

export function Krc20TickerSearchField({
  value,
  onChange,
  onSelect,
  disabled,
  selected,
}: Krc20TickerSearchFieldProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<Krc20TokenInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected) return;

    const tick = value.trim().toUpperCase();
    if (tick.length < 4) {
      setResult(null);
      setNotFound(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const info = await fetchKrc20TokenInfo(tick);
        setResult(info);
        setNotFound(!info);
      } catch {
        setResult(null);
        setNotFound(true);
        setError('Lookup failed. Try again.');
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [value, selected]);

  const displayResult = selected ?? result;

  return (
    <div className="space-y-2">
      <KxFormFieldLabel>
        KRC-20 ticker <span className="text-red-500">*</span>
      </KxFormFieldLabel>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="e.g. KREX"
        className="k-input text-base w-full"
        disabled={disabled || Boolean(selected)}
        autoComplete="off"
      />
      {isSearching ? (
        <p className="text-xs text-zinc-500">Searching Kasplex indexer…</p>
      ) : null}
      {notFound && !selected ? (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          No KRC-20 token found for &quot;{value.trim().toUpperCase()}&quot;. Check the ticker and try again.
        </p>
      ) : null}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}

      {displayResult && !selected ? (
        <button
          type="button"
          onClick={() => onSelect(displayResult)}
          className="w-full rounded-xl border border-[#02abb8]/40 bg-[#02abb8]/5 p-4 text-left transition hover:border-[#02abb8] hover:bg-[#02abb8]/10"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{displayResult.ticker}</span>
            <span className="rounded-md bg-[#02abb8]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#02abb8]">
              Select token
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{displayResult.name}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Max: {formatKrc20Supply(displayResult.maxSupply, displayResult.decimals ?? 8)}</span>
            <span>Minted: {formatKrc20Supply(displayResult.minted, displayResult.decimals ?? 8)}</span>
            {displayResult.deployer ? (
              <span className="col-span-2 truncate font-mono text-[10px]" title={displayResult.deployer}>
                Deployer: {displayResult.deployer}
              </span>
            ) : null}
          </div>
        </button>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              On-chain token loaded: {selected.ticker}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                onSelect(null);
              }}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {selected.name} · Deployer: {selected.deployer ?? 'unknown'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
