'use client';

import { useEffect, useMemo, useState } from 'react';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { fetchGlobalTop100Snapshot } from '@/lib/leaderboard/top100';

export function GlobalTop100Preview({ title = 'Global Top 100' }: { title?: string }) {
  const season = useMemo(() => currentSeasonWindowUtc(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await fetchGlobalTop100Snapshot(season.id);
        if (cancelled) return;
        setCount(snap?.items?.length ?? 0);
      } catch {
        if (cancelled) return;
        setError('Could not load snapshot.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [season.id]);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-3 chronicles-vault-card">
      <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">{title}</p>
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Season <span className="font-mono">{season.id}</span>.{' '}
        {loading ? 'Loading…' : error ? error : count > 0 ? `${count} entries available.` : 'Snapshot not published yet.'}
      </p>
    </div>
  );
}

