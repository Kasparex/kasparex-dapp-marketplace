'use client';

import { useEffect, useMemo, useState } from 'react';

type UsageSnapshot = {
  nowIsoMinuteUtc: string;
  sampleRate: number;
  minutes: string[];
  dimensions: { id: string; label: string }[];
  series: Record<string, number[]>;
  totals: Record<string, number>;
  last5m: Record<string, number>;
  prev55mAvgPer5m: Record<string, number>;
};

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function UsageMonitor() {
  const [data, setData] = useState<UsageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/stats/usage${window.location.search}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const j = (await res.json()) as UsageSnapshot;
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed');
      }
    };
    run();
    const t = setInterval(run, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const spikes = useMemo(() => {
    if (!data) return [];
    const out: { id: string; label: string; ratio: number }[] = [];
    for (const d of data.dimensions) {
      const last5 = data.last5m[d.id] ?? 0;
      const base = data.prev55mAvgPer5m[d.id] ?? 0;
      const ratio = base > 0 ? last5 / base : last5 > 0 ? Infinity : 0;
      if (ratio >= 3 && last5 >= 50) out.push({ id: d.id, label: d.label, ratio });
    }
    return out.sort((a, b) => b.ratio - a.ratio);
  }, [data]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Usage Monitor</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Lightweight sampled counters for early spike detection (no Vercel Premium logs).
            </p>
          </div>
          {data ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              UTC minute: <span className="font-mono">{data.nowIsoMinuteUtc}</span> · sample:{' '}
              <span className="font-mono">{data.sampleRate}</span>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : null}
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Totals (last 60m, scaled)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.dimensions.map((d) => (
                  <div key={d.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{d.label}</div>
                    <div className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {fmt(data.totals[d.id] ?? 0)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      last 5m: {fmt(data.last5m[d.id] ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Spike alerts
              </div>
              {spikes.length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">No spikes detected.</div>
              ) : (
                <ul className="space-y-3">
                  {spikes.slice(0, 8).map((s) => (
                    <li key={s.id} className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-3">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.label}</div>
                      <div className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                        last 5m is ~{Number.isFinite(s.ratio) ? s.ratio.toFixed(1) : '∞'}× baseline
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                Baseline = average per-5m over the previous 55 minutes.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-3">
              Notes
            </div>
            <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>Counts are sampled at the edge and scaled by \(1 / sampleRate\).</li>
              <li>Use this for trend detection, not billing-grade accuracy.</li>
              <li>If you see a spike on <span className="font-mono">api.leaderboard.finalize</span>, check cron secret/config immediately.</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-sm text-zinc-600 dark:text-zinc-400">
          Loading counters…
        </div>
      )}
    </section>
  );
}

