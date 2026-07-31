'use client';

import { useCallback, useEffect, useState } from 'react';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { normalizeKcc20ConnectPaste } from '@/lib/programmable/kron';
import {
  formatKcc20Sompi,
  resolveKcc20ConnectInput,
  type Kcc20TokenInfo,
} from '@/lib/tokens/kcc20Lookup';
import {
  TOKEN_LAUNCH_DEX_OPTIONS,
  getTokenLaunchDex,
  type TokenLaunchDexId,
} from '@/lib/tokens/launchDexes';

interface Kcc20ConnectFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (info: Kcc20TokenInfo | null) => void;
  disabled?: boolean;
  selected?: Kcc20TokenInfo | null;
  /** When true, auto-run lookup once value is a valid 64-hex id (dashboard deep-link). */
  autoLookup?: boolean;
}

export function Kcc20ConnectField({
  value,
  onChange,
  onSelect,
  disabled,
  selected,
  autoLookup = false,
}: Kcc20ConnectFieldProps) {
  const [launchDex, setLaunchDex] = useState<TokenLaunchDexId>('kron');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<Kcc20TokenInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didAutoLookup, setDidAutoLookup] = useState(false);

  const dex = getTokenLaunchDex(launchDex);
  const network = DEFAULT_PROGRAMMABLE_NETWORK;

  const runLookup = useCallback(async () => {
    const input = normalizeKcc20ConnectPaste(value);
    if (input !== value) {
      onChange(input);
    }
    if (!/^[a-f0-9]{64}$/.test(input)) {
      setError('Enter a 64-character hex covenant id, genesis tx id, or a KRON token URL.');
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
        setError('No indexed covenant found yet. Deploy on mainnet and try again.');
      }
    } catch {
      setResult(null);
      setNotFound(true);
      setError('Lookup failed. Check the id, then try again.');
    } finally {
      setIsSearching(false);
    }
  }, [value, network, onChange]);

  useEffect(() => {
    if (!autoLookup || didAutoLookup || selected || isSearching) return;
    const input = normalizeKcc20ConnectPaste(value);
    if (!/^[a-f0-9]{64}$/.test(input)) return;
    setDidAutoLookup(true);
    void runLookup();
  }, [autoLookup, didAutoLookup, selected, isSearching, value, runLookup]);

  const displayResult = selected ?? result;

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Deploy on an L1 DEX</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Kasparex lists tokens and adds Hub utilities. Launch the covenant on a Kaspa L1 DEX, then paste
            the covenant id or token URL below.
          </p>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Launchpad</p>
          <div className={disabled ? 'pointer-events-none opacity-60' : undefined}>
            <KxSegmentToggle
              value={launchDex}
              onChange={setLaunchDex}
              ariaLabel="Launchpad"
              options={TOKEN_LAUNCH_DEX_OPTIONS.map((option) => ({
                value: option.id,
                label: option.active ? option.label : `${option.label} (soon)`,
                disabled: !option.active,
                title: option.blurb,
              }))}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{dex.blurb}</p>
        </div>

        {dex.active && dex.launchUrl ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={dex.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="k-control-btn text-sm hub-sidebar-action-active"
            >
              {dex.launchLabel ?? `Launch on ${dex.label}`}
            </a>
            {dex.exploreUrl ? (
              <a
                href={dex.exploreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="k-control-btn text-sm"
              >
                {dex.exploreLabel ?? `Browse ${dex.label}`}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {dex.label} connect is not live yet. Use KRON to launch on mainnet for now.
          </p>
        )}
      </div>

      <div>
        <KxFormFieldLabel>
          Covenant id, genesis tx, or DEX token URL <span className="text-red-500">*</span>
        </KxFormFieldLabel>
        <p className="kx-body-sm mb-2">
          Paste a KCC-20 covenant id, genesis transaction id, or a DEX token link (for example{' '}
          <span>kron.technology/token/…</span>). Lookups use mainnet indexers
          (kcc20.info, with KaspaCom / kascov fallback). Nothing is deployed from this form.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeKcc20ConnectPaste(e.target.value))}
          placeholder="64-char hex or https://kron.technology/token/…"
          className="k-input w-full text-sm"
          disabled={disabled || Boolean(selected)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {!selected ? (
        <button
          type="button"
          onClick={() => void runLookup()}
          disabled={disabled || isSearching || normalizeKcc20ConnectPaste(value).length < 64}
          className={`${KX_FORM_ADD_BTN_CLASS} disabled:opacity-50`}
        >
          {isSearching ? 'Looking up covenant…' : 'Look up covenant'}
        </button>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
      {notFound && !selected && !error ? (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          No indexed covenant found for this id on mainnet.
        </p>
      ) : null}

      {displayResult && !selected ? (
        <button
          type="button"
          onClick={() => onSelect(displayResult)}
          className="w-full rounded-xl border border-[#02abb8]/40 bg-[#02abb8]/5 p-4 text-left transition hover:border-[#02abb8] hover:bg-[#02abb8]/10"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {displayResult.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayResult.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : null}
              <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{displayResult.ticker}</span>
            </div>
            <span className="rounded-md bg-[#02abb8]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#02abb8]">
              Connect token
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{displayResult.name}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Status: {displayResult.status ?? 'unknown'}</span>
            {displayResult.holderTotal != null ? (
              <span>Holders: {displayResult.holderTotal.toLocaleString()}</span>
            ) : (
              <span>
                Live:{' '}
                {formatKcc20Sompi(
                  displayResult.liveValueSompi ?? displayResult.minted,
                  displayResult.decimals ?? 8,
                )}{' '}
                KAS
              </span>
            )}
            {displayResult.maxSupply ? (
              <span className="col-span-2">
                Supply: {formatKcc20Sompi(displayResult.maxSupply, displayResult.decimals ?? 8)}
              </span>
            ) : null}
            {displayResult.templateLabel ? (
              <span className="col-span-2">Template: {displayResult.templateLabel}</span>
            ) : null}
            {displayResult.readSource ? (
              <span className="col-span-2">
                Source:{' '}
                {displayResult.readSource === 'kcc20Info'
                  ? 'kcc20.info'
                  : displayResult.readSource === 'kaspaCom'
                    ? 'KaspaCom'
                    : 'kascov'}
              </span>
            ) : null}
            <span className="col-span-2 truncate text-[10px]" title={displayResult.covenantId}>
              Covenant: {displayResult.covenantId}
            </span>
          </div>
        </button>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {selected.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.imageUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full border border-emerald-500/30 object-cover"
                />
              ) : null}
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Programmable token connected: {selected.ticker}
              </span>
            </div>
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
          <p className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-400">{selected.covenantId}</p>
        </div>
      ) : null}
    </div>
  );
}
