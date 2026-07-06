'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kascovCovenantExplorerUrl,
  kascovDecodeUrl,
  programmableCovenantExplorerUrl,
} from '@/lib/programmable/config';
import { covenantLiveValueSompi, resolveCovenantDetail } from '@/lib/programmable/covenantRead';
import { isProgrammableToken, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';
import type { CovenantReadSource } from '@/lib/programmable/types';
import { formatKcc20Sompi } from '@/lib/tokens/kcc20Lookup';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

type ProgrammableAssetPanelProps = {
  token: Token;
};

export function ProgrammableAssetPanel({ token }: ProgrammableAssetPanelProps) {
  const covenantId = resolveProgrammableCovenantId(token);
  const networkId = token.onChainSnapshot?.networkId ?? DEFAULT_PROGRAMMABLE_NETWORK;
  const [status, setStatus] = useState(token.onChainSnapshot?.status ?? 'unknown');
  const [liveValue, setLiveValue] = useState(token.onChainSnapshot?.liveValueSompi);
  const [templateLabel, setTemplateLabel] = useState(token.onChainSnapshot?.templateLabel);
  const [readSource, setReadSource] = useState<CovenantReadSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!covenantId) return;
    setIsRefreshing(true);
    try {
      const detail = await resolveCovenantDetail(covenantId, networkId, { skipCache: true });
      if (detail) {
        setStatus(detail.status ?? 'unknown');
        setLiveValue(covenantLiveValueSompi(detail));
        setTemplateLabel(detail.template);
        setReadSource(detail.source);
        setLastFetched(new Date().toISOString());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [covenantId, networkId]);

  useEffect(() => {
    if (!covenantId || token.onChainSnapshot?.fetchedAt) return;
    void refresh();
  }, [covenantId, refresh, token.onChainSnapshot?.fetchedAt]);

  if (!isProgrammableToken(token) || !covenantId) return null;

  const kaspaComUrl = programmableCovenantExplorerUrl(covenantId, networkId);
  const kascovUrl = kascovCovenantExplorerUrl(covenantId, networkId);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      <DAppSectionHeader title="Programmable L1 asset" className="mb-1" />
      <p className="kx-body-sm">
        This project is linked to a KCC-20 / covenant token on {networkId}. Status is fetched on demand from
        the KaspaCom covenant indexer (kascov fallback); Kasparex does not run a chain indexer.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            status === 'active'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : status === 'burned'
                ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          }`}
        >
          {status}
        </span>
        {templateLabel ? (
          <span className="rounded-md bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-300">
            {templateLabel}
          </span>
        ) : null}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Network: {networkId}</span>
        {readSource ? (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">via {readSource}</span>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Covenant id</dt>
          <dd className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-200">{covenantId}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Live value</dt>
          <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatKcc20Sompi(liveValue, token.decimals ?? 8)} KAS
          </dd>
        </div>
        {token.onChainSnapshot?.genesisTxid ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Genesis tx</dt>
            <dd className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-200">
              {token.onChainSnapshot.genesisTxid}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <a
          href={kaspaComUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="k-control-btn text-sm"
        >
          View on KaspaCom
        </a>
        <a
          href={kascovUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="k-control-btn text-sm"
        >
          View on kascov
        </a>
        <a
          href={kascovDecodeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="k-control-btn text-sm"
        >
          Script decoder
        </a>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isRefreshing}
          className="k-control-btn text-sm disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </div>

      {lastFetched ? (
        <p className="text-[10px] text-zinc-500">Last refreshed {new Date(lastFetched).toLocaleString()}</p>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Deployed elsewhere?{' '}
        <Link href="/tokens/dashboard" className="font-semibold" style={{ color: TOKENS_ACCENT }}>
          Connect another covenant
        </Link>{' '}
        from your token dashboard.
      </p>
    </section>
  );
}
