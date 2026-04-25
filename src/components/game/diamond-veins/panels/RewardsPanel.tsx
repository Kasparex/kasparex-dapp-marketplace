'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GridLedgerEntry } from '@/lib/game/engine';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { RewardsRedeemSection } from '@/components/games/RewardsRedeemSection';

export function RewardsPanel({
  address,
  diamondsBalance,
  refinementPointsTotal,
  localLedger,
  onRefine,
  onRedeem,
}: {
  address: string | undefined;
  diamondsBalance: number;
  refinementPointsTotal: number;
  localLedger: GridLedgerEntry[];
  onRefine?: (amount: number) => void;
  onRedeem?: (points: number) => void;
}) {
  const [remote, setRemote] = useState<GridLedgerEntry[] | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    void fetch(`/api/games/diamond-veins/grid-ledger?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((j: { entries?: GridLedgerEntry[] }) => {
        if (!cancelled && Array.isArray(j.entries)) setRemote(j.entries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address]);

  const entries = remote?.length ? remote : localLedger;

  return (
    <div className="space-y-6">
      <RewardsRedeemSection 
        diamondsBalance={diamondsBalance} 
        refinementPointsBalance={refinementPointsTotal}
        onRefine={onRefine}
        onRedeem={onRedeem}
      >

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <tr>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Diamonds</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Points</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">GRID score</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                  No refine checkpoints yet. Refine in the Mining tab to create your first ledger row.
                </td>
              </tr>
            ) : (
              [...entries].reverse().map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(e.at).toLocaleString()}</td>
                  <td className="p-3 tabular-nums text-zinc-800 dark:text-zinc-200">{e.diamondsRefined.toLocaleString()}</td>
                  <td className="p-3 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    {e.refinementPoints.toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">{e.gridCheckpointScore.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {remote ? 'Showing server ledger when available.' : 'Showing device ledger until server sync.'}
      </p>
      </RewardsRedeemSection>
    </div>
  );
}
