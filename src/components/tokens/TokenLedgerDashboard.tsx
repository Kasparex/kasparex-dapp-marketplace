'use client';

import { formatLargeNumber } from '@/lib/rewards/calculator';
import type { TokenLedgerSnapshot } from '@/lib/tokens/ledger';
import { getLedgerCirculatingSupply, sumLedger } from '@/lib/tokens/ledger';

export function TokenLedgerDashboard({ snapshot }: { snapshot: TokenLedgerSnapshot }) {
  const circulating = getLedgerCirculatingSupply(snapshot);
  const accounted = sumLedger(snapshot.lines);

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Token Dashboard (internal ledger)
        </div>
        <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
          {snapshot.symbol} supply & distribution
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          GRID has a fixed supply of 10B on Kaspa L1. L2 deployments are operational layers used for rewards and utility.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total Supply" value={`${formatLargeNumber(snapshot.maxSupply)} ${snapshot.symbol}`} />
        <Metric label="Circulating (est.)" value={`${formatLargeNumber(circulating)} ${snapshot.symbol}`} />
        <Metric label="Accounted (ledger)" value={`${formatLargeNumber(accounted)} ${snapshot.symbol}`} />
        <Metric label="As of" value={new Date(snapshot.asOf).toLocaleString()} />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Breakdown</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {snapshot.lines.map((line) => (
            <div
              key={line.label}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{line.label}</div>
              <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(line.amount)} {line.unit}
              </div>
              {line.note && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{line.note}</div>}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

