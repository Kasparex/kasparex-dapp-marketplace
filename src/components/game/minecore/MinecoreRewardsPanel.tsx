'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GridLedgerEntry } from '@/lib/game/engine';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { RewardsRedeemSection } from '@/components/games/RewardsRedeemSection';

export function MinecoreRewardsPanel({
  address,
  refinementPointsTotal,
  localLedger,
}: {
  address: string | undefined;
  refinementPointsTotal: number;
  localLedger: GridLedgerEntry[];
}) {
  const [remote, setRemote] = useState<GridLedgerEntry[] | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    void fetch(`/api/games/minecore/grid-ledger?address=${encodeURIComponent(address)}`)
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Refinement &amp; GRID checkpoints
          <GameTooltip content="Each refine creates a checkpoint row. GRID distribution on Kasplex L2 uses RewardManager / FeeRouter patterns elsewhere in Kasparex — this ledger is your local and server audit trail.">
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Total refinement points:{' '}
          <strong className="text-emerald-600 dark:text-emerald-400">{refinementPointsTotal.toLocaleString()}</strong>
        </p>
        <Link
          href="/rewards-and-points"
          className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Open Rewards &amp; Points
        </Link>
      </div>

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
                  No refine checkpoints yet. Refine diamonds in the Redeem tab to create your first ledger row.
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
        {remote?.length ? 'Showing server ledger when available.' : 'Showing device ledger until Minecore server sync is enabled.'}
      </p>

      <RewardsRedeemSection diamondsBalance={refinementPointsTotal} />
    </div>
  );
}
