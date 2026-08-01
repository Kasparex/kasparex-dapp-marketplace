'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kascovCovenantExplorerUrl,
  kascovDecodeUrl,
  kcc20InfoBase,
  programmableCovenantExplorerUrl,
} from '@/lib/programmable/config';
import { kronTokenUrl } from '@/lib/programmable/kron';
import { covenantLiveValueSompi, resolveCovenantDetail } from '@/lib/programmable/covenantRead';
import { isProgrammableToken, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';
import type { CovenantReadSource } from '@/lib/programmable/types';
import { formatKcc20Sompi } from '@/lib/tokens/kcc20Lookup';
import { TokenCopyableAddress } from '@/components/tokens/TokenCopyableAddress';
import { TokenStatCard } from '@/components/tokens/TokenStatCard';
import { KX_METADATA_STAT_GRID } from '@/lib/hub/shellTokens';

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
  const kronUrl = networkId === 'mainnet' ? kronTokenUrl(covenantId) : null;
  const kcc20InfoUrl = networkId === 'mainnet' ? kcc20InfoBase() : null;
  const sourceHint =
    readSource === 'kcc20Info'
      ? 'via kcc20.info'
      : readSource === 'kaspaCom'
        ? 'via KaspaCom'
        : readSource === 'kascov'
          ? 'via kascov'
          : networkId;

  return (
    <section className="scroll-mt-28 space-y-4">
      <GameOverviewTitleBlock
        kicker="Programmable"
        title="L1 covenant asset"
        subtitle={`Linked KCC-20 on ${networkId}. Status is fetched on demand from public covenant indexers (kcc20.info / KaspaCom / kascov).`}
        as="h3"
        compact
      />

      <div className={KX_METADATA_STAT_GRID}>
        <TokenStatCard
          label="Status"
          value={status}
          hint={sourceHint}
          valueClassName={
            status === 'active'
              ? 'text-emerald-600 dark:text-emerald-400'
              : status === 'burned'
                ? 'text-zinc-500'
                : 'text-amber-600 dark:text-amber-400'
          }
          tooltipTitle="Covenant status"
          tooltipDescription="Live status from the covenant indexer for this programmable asset."
        />
        <TokenStatCard
          label="Live value"
          value={`${formatKcc20Sompi(liveValue, token.decimals ?? 8)} KAS`}
          hint={templateLabel ?? 'Covenant balance'}
          valueClassName="text-[color:var(--hub-accent)]"
          tooltipTitle="Live value"
          tooltipDescription="On-chain KAS value currently associated with this covenant."
        />
        <TokenStatCard
          label="Network"
          value={networkId}
          hint={templateLabel ? `Template: ${templateLabel}` : 'Programmable L1'}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Covenant id
        </p>
        <TokenCopyableAddress
          value={covenantId}
          copyLabel="Copy covenant id"
          explorerUrl={kaspaComUrl}
        />
        {token.onChainSnapshot?.genesisTxid ? (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Genesis tx
            </p>
            <TokenCopyableAddress
              value={token.onChainSnapshot.genesisTxid}
              copyLabel="Copy genesis tx id"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {kronUrl ? (
          <a href={kronUrl} target="_blank" rel="noopener noreferrer" className="k-control-btn text-sm hub-sidebar-action-active">
            Trade on KRON
          </a>
        ) : null}
        <a href={kaspaComUrl} target="_blank" rel="noopener noreferrer" className="k-control-btn text-sm">
          View on KaspaCom
        </a>
        <a href={kascovUrl} target="_blank" rel="noopener noreferrer" className="k-control-btn text-sm">
          View on kascov
        </a>
        {kcc20InfoUrl ? (
          <a href={kcc20InfoUrl} target="_blank" rel="noopener noreferrer" className="k-control-btn text-sm">
            View on kcc20.info
          </a>
        ) : null}
        <a href={kascovDecodeUrl()} target="_blank" rel="noopener noreferrer" className="k-control-btn text-sm">
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
        <p className="text-xs font-medium text-zinc-500">Last refreshed {new Date(lastFetched).toLocaleString()}</p>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Deployed elsewhere?{' '}
        <Link
          href="/tokens/dashboard"
          className="font-semibold text-[color:var(--hub-accent)] hover:underline"
        >
          Connect another covenant
        </Link>{' '}
        from your token dashboard.
      </p>
    </section>
  );
}
