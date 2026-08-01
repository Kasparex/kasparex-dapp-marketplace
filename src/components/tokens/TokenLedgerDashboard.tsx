'use client';

import { formatLargeNumber } from '@/lib/rewards/calculator';
import type { TokenLedgerSnapshot } from '@/lib/tokens/ledger';
import { getLedgerCirculatingSupply, sumLedger } from '@/lib/tokens/ledger';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import {
  KX_METADATA_STAT_CARD,
  KX_METADATA_STAT_GRID,
  KX_PANEL,
  metadataStatItemSpanClass,
} from '@/lib/hub/shellTokens';

export function TokenLedgerDashboard({ snapshot }: { snapshot: TokenLedgerSnapshot }) {
  const circulating = getLedgerCirculatingSupply(snapshot);
  const accounted = sumLedger(snapshot.lines);
  const metrics: HubMetadataStat[] = [
    {
      label: 'Total supply',
      value: `${formatLargeNumber(snapshot.maxSupply)} ${snapshot.symbol}`,
      copyable: false,
    },
    {
      label: 'Circulating (est.)',
      value: `${formatLargeNumber(circulating)} ${snapshot.symbol}`,
      accent: true,
      copyable: false,
    },
    {
      label: 'Accounted (ledger)',
      value: `${formatLargeNumber(accounted)} ${snapshot.symbol}`,
      copyable: false,
    },
    {
      label: 'As of',
      value: new Date(snapshot.asOf).toLocaleString(),
      copyable: false,
    },
  ];

  return (
    <section className={`${KX_PANEL} space-y-4 p-6`}>
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Token Dashboard (internal ledger)
        </div>
        <div className="hub-tokens-title text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {snapshot.symbol} supply & distribution
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          GRID has a fixed supply of 10B on Kaspa L1. L2 deployments are operational layers used for rewards and
          utility.
        </div>
      </div>

      <HubMetadataStatGrid stats={metrics} />

      <div className="space-y-2">
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Breakdown</div>
        <div className={KX_METADATA_STAT_GRID}>
          {snapshot.lines.map((line, index) => (
            <div
              key={line.label}
              className={`${KX_METADATA_STAT_CARD} ${metadataStatItemSpanClass(index, snapshot.lines.length)}`.trim()}
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {line.label}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(line.amount)} {line.unit}
              </div>
              {line.note ? (
                <div className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{line.note}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        This section is an internal accounting ledger for external clarity. It may not be provable purely on-chain.
      </div>
    </section>
  );
}
