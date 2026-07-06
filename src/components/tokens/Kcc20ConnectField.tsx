'use client';

import { useCallback, useState } from 'react';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import {
  formatKcc20Sompi,
  resolveKcc20ConnectInput,
  type Kcc20TokenInfo,
} from '@/lib/tokens/kcc20Lookup';

interface Kcc20ConnectFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (info: Kcc20TokenInfo | null) => void;
  disabled?: boolean;
  selected?: Kcc20TokenInfo | null;
  network?: ProgrammableNetworkId;
  onNetworkChange?: (network: ProgrammableNetworkId) => void;
}

const NETWORK_OPTIONS: Array<{ value: ProgrammableNetworkId; label: string }> = [
  { value: 'testnet-10', label: 'Testnet-10' },
  { value: 'mainnet', label: 'Mainnet (early)' },
];

export function Kcc20ConnectField({
  value,
  onChange,
  onSelect,
  disabled,
  selected,
  network = DEFAULT_PROGRAMMABLE_NETWORK,
  onNetworkChange,
}: Kcc20ConnectFieldProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<Kcc20TokenInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runLookup = useCallback(async () => {
    const input = value.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(input)) {
      setError('Enter a 64-character hex covenant id or genesis transaction id.');
      setResult(null);
      setNotFound(false);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const info = await resolveKcc20ConnectInput(input, network);
      setResult(info);
      setNotFound(!info);
      if (!info) {
        setError('No indexed covenant found yet. Deploy on the selected network and try again.');
      }
    } catch {
      setResult(null);
      setNotFound(true);
      setError('Lookup failed. Check the id and network, then try again.');
    } finally {
      setIsSearching(false);
    }
  }, [value, network]);

  const displayResult = selected ?? result;

  return (
    <div className="space-y-3">
      <div>
        <KxFormFieldLabel>Programmable network</KxFormFieldLabel>
        <div className="mt-2">
          <KxFormDropdown
            ariaLabel="Programmable network"
            value={network}
            onChange={(v) => onNetworkChange?.(v as ProgrammableNetworkId)}
            options={NETWORK_OPTIONS}
            disabled={disabled || Boolean(selected)}
          />
        </div>
      </div>

      <div>
        <KxFormFieldLabel>
          Covenant id or genesis tx <span className="text-red-500">*</span>
        </KxFormFieldLabel>
        <p className="kx-body-sm mb-2">
          Paste the KCC-20 covenant id from your launchpad, or the genesis transaction id. Kasparex reads
          public KaspaCom indexer data (kascov fallback); nothing is deployed from this form.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          placeholder="64-char hex covenant id or tx id"
          className="k-input font-mono text-sm w-full"
          disabled={disabled || Boolean(selected)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {!selected ? (
        <button
          type="button"
          onClick={() => void runLookup()}
          disabled={disabled || isSearching || value.trim().length < 64}
          className="k-control-btn text-sm disabled:opacity-50"
        >
          {isSearching ? 'Looking up covenant…' : 'Look up covenant'}
        </button>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
      {notFound && !selected && !error ? (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          No indexed covenant found for this id on {network}.
        </p>
      ) : null}

      {displayResult && !selected ? (
        <button
          type="button"
          onClick={() => onSelect(displayResult)}
          className="w-full rounded-xl border border-[#02abb8]/40 bg-[#02abb8]/5 p-4 text-left transition hover:border-[#02abb8] hover:bg-[#02abb8]/10"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{displayResult.ticker}</span>
            <span className="rounded-md bg-[#02abb8]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#02abb8]">
              Connect token
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{displayResult.name}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Status: {displayResult.status ?? 'unknown'}</span>
            <span>
              Live: {formatKcc20Sompi(displayResult.liveValueSompi ?? displayResult.minted, displayResult.decimals ?? 8)} KAS
            </span>
            {displayResult.templateLabel ? (
              <span className="col-span-2">Template: {displayResult.templateLabel}</span>
            ) : null}
            <span className="col-span-2 truncate font-mono text-[10px]" title={displayResult.covenantId}>
              Covenant: {displayResult.covenantId}
            </span>
          </div>
        </button>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Programmable token connected: {selected.ticker}
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
          <p className="mt-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{selected.covenantId}</p>
        </div>
      ) : null}
    </div>
  );
}
