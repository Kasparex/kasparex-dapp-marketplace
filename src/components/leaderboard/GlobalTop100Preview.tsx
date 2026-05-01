'use client';

import { useEffect, useMemo, useState } from 'react';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { nodeFirstGet } from '@/lib/nodes/node-first';

export function GlobalTop100Preview({ title = 'Global Top 100' }: { title?: string }) {
  const season = useMemo(() => currentSeasonWindowUtc(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [status, setStatus] = useState<string>('live');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await nodeFirstGet<{
          ok?: boolean;
          snapshot?: { items?: unknown[] } | null;
          seasonMeta?: { status?: string } | null;
        }>(`/kasparex/leaderboard/top100?season=${encodeURIComponent(season.id)}`, {
          roles: ['mirror', 'light'],
          maxNodeAttempts: 3,
          timeoutMs: 3200,
        });
        const j = r.data;
        const snap = j.ok ? j.snapshot : null;
        if (cancelled) return;
        setCount(snap?.items?.length ?? 0);
        setStatus(j.seasonMeta?.status ?? 'live');
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
      <div className="flex items-center gap-2">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">{title}</p>
        <Tooltip
          content={gameTooltipRich(
            'Leaderboard snapshot',
            'Published snapshot for finalized seasons. Values are immutable once published.',
          )}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 text-[10px] font-black text-zinc-500">i</span>
        </Tooltip>
      </div>
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Season <span className="font-mono">{season.id}</span>.{' '}
        {loading ? 'Loading…' : error ? error : count > 0 ? `${count} entries available.` : 'Snapshot not published yet.'}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Status: <span className="font-mono">{status}</span></p>
    </div>
  );
}

