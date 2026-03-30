'use client';

import { useEffect, useState } from 'react';
import { ChroniclesLeaderboardTable, type ChroniclesLeaderboardRow } from './ChroniclesLeaderboardTable';

export function ChroniclesLeaderboardTableLazy({
  initialRows,
  initialLimit = 20,
  step = 30,
}: {
  initialRows: ChroniclesLeaderboardRow[];
  initialLimit?: number;
  step?: number;
}) {
  const [rows, setRows] = useState<ChroniclesLeaderboardRow[]>(initialRows);
  const [limit, setLimit] = useState<number>(Math.max(initialLimit, initialRows.length));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function loadMore() {
    setError(null);
    setBusy(true);
    try {
      const nextLimit = Math.min(300, limit + step);
      const res = await fetch(`/api/chronicles/leaderboard/rows?limit=${nextLimit}`, { cache: 'no-store' });
      const j = (await res.json()) as { ok?: boolean; rows?: ChroniclesLeaderboardRow[]; error?: string };
      if (!j.ok || !Array.isArray(j.rows)) throw new Error(j.error ?? 'Could not load more rows.');
      setRows(j.rows);
      setLimit(nextLimit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load more rows.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ChroniclesLeaderboardTable rows={rows} />
      <div className="flex items-center justify-center">
        <button type="button" className="k-control-btn" onClick={() => void loadMore()} disabled={busy || rows.length >= 300}>
          {busy ? 'Loading…' : rows.length >= 300 ? 'All loaded' : 'Load more'}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p> : null}
    </div>
  );
}

