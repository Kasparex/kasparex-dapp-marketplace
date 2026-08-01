'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GridLedgerEntry } from '@/lib/game/engine';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';

export function RewardsPanel({
  address,
  localLedger,
}: {
  address: string | undefined;
  localLedger: GridLedgerEntry[];
}) {
  const [remote, setRemote] = useState<GridLedgerEntry[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

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

  const rows = useMemo(() => {
    let list = [...(remote?.length ? remote : localLedger)];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          new Date(e.at).toLocaleString().toLowerCase().includes(q),
      );
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.diamondsRefined - b.diamondsRefined);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.diamondsRefined - a.diamondsRefined);
    } else {
      list.sort((a, b) => b.at - a.at);
    }
    return list;
  }, [remote, localLedger, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={['Operational', 'Legacy']}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <tr>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Diamonds</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Hub points</th>
              <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Hub weight</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                  No refine checkpoints yet. Mine and refine Diamonds from the Game Deck to earn Hub points.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(e.at).toLocaleString()}</td>
                  <td className="p-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                    {e.diamondsRefined.toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    {e.refinementPoints.toLocaleString()}
                  </td>
                  <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {e.gridCheckpointScore.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {remote ? 'Showing server ledger when available.' : 'Showing device ledger until server sync.'}
      </p>
    </div>
  );
}
