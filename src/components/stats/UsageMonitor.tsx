'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toaster';
import { STATS_PANEL } from '@/lib/stats/statsUi';

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

type HealthLevel = 'ok' | 'learning' | 'warning' | 'alert' | 'error';

function levelMeta(level: HealthLevel): { label: string; dot: string; ring: string; text: string } {
  switch (level) {
    case 'ok':
      return {
        label: 'Stable',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-300',
      };
    case 'learning':
      return {
        label: 'Learning',
        dot: 'bg-sky-500',
        ring: 'ring-sky-500/30',
        text: 'text-sky-700 dark:text-sky-300',
      };
    case 'warning':
      return {
        label: 'Elevated',
        dot: 'bg-amber-500',
        ring: 'ring-amber-500/30',
        text: 'text-amber-800 dark:text-amber-300',
      };
    case 'alert':
      return {
        label: 'Spike',
        dot: 'bg-red-500',
        ring: 'ring-red-500/30',
        text: 'text-red-800 dark:text-red-300',
      };
    case 'error':
    default:
      return {
        label: 'Offline',
        dot: 'bg-zinc-400',
        ring: 'ring-zinc-400/30',
        text: 'text-zinc-600 dark:text-zinc-400',
      };
  }
}

export function UsageMonitor() {
  const [data, setData] = useState<UsageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const lastNotifiedAtRef = useRef<number>(0);
  const toastApi = useToast();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
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

  const isWarmingUp = useMemo(() => {
    if (!data) return true;
    // If we don't yet have much history, ratios can be misleading.
    return (data.minutes?.length ?? 0) < 30;
  }, [data]);

  const spikes = useMemo(() => {
    if (!data) return [];
    const out: { id: string; label: string; ratio: number }[] = [];
    for (const d of data.dimensions) {
      const last5 = data.last5m[d.id] ?? 0;
      const base = data.prev55mAvgPer5m[d.id] ?? 0;
      const ratio = base > 0 ? last5 / base : last5 > 0 ? Infinity : 0;
      // Guard against cold baseline false positives:
      // - ignore when baseline is very small (common right after enabling the monitor)
      // - require a meaningful absolute volume in addition to ratio
      if (base >= 20 && ratio >= 3 && last5 >= 100) out.push({ id: d.id, label: d.label, ratio });
    }
    return out.sort((a, b) => b.ratio - a.ratio);
  }, [data]);

  const health = useMemo((): HealthLevel => {
    if (error) return 'error';
    if (!data) return 'learning';
    if (isWarmingUp) return 'learning';
    if (spikes.length > 0) return 'alert';
    // Mild warning if there is a recent jump (2x baseline) but not large enough to alert.
    const elevated = data.dimensions.some((d) => {
      const last5 = data.last5m[d.id] ?? 0;
      const base = data.prev55mAvgPer5m[d.id] ?? 0;
      const ratio = base > 0 ? last5 / base : last5 > 0 ? Infinity : 0;
      return base >= 10 && ratio >= 2 && last5 >= 50;
    });
    return elevated ? 'warning' : 'ok';
  }, [data, error, isWarmingUp, spikes.length]);

  useEffect(() => {
    if (!notifyEnabled) return;
    if (!data) return;
    if (spikes.length === 0) return;

    const now = Date.now();
    if (now - lastNotifiedAtRef.current < 5 * 60_000) return;
    lastNotifiedAtRef.current = now;

    const top = spikes[0];
    const msg = `${top.label} is ~${Number.isFinite(top.ratio) ? top.ratio.toFixed(1) : '∞'}× baseline (last 5m).`;

    toastApi.toast({
      title: 'Usage spike detected',
      description: msg,
      variant: 'warning',
      duration: 8000,
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const show = () => {
        try {
          // eslint-disable-next-line no-new
          new Notification('Kasparex usage spike', { body: msg });
        } catch {}
      };

      if (Notification.permission === 'granted') {
        show();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) => {
          if (p === 'granted') show();
        });
      }
    }
  }, [data, notifyEnabled, spikes, toastApi]);

  const meta = levelMeta(health);

  return (
    <section className="space-y-6">
      <div className={`${STATS_PANEL} p-4 sm:p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${meta.text}`}
              title="Overall health based on last 5 minutes vs baseline"
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            {isWarmingUp ? (
              <span className="text-xs text-sky-700 dark:text-sky-300">
                Baseline still building (~30 min warmup).
              </span>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <button
              type="button"
              onClick={() => setNotifyEnabled((v) => !v)}
              className={`k-control-btn text-xs ${
                notifyEnabled
                  ? '!border-[#02abb8]/40 !bg-[#02abb8]/10 !text-[#02abb8]'
                  : ''
              }`}
            >
              Alerts {notifyEnabled ? 'On' : 'Off'}
            </button>
            {data ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 k-control-btn !cursor-default">
                <span className="font-mono">{data.nowIsoMinuteUtc}</span>
                <span className="mx-2 text-zinc-300 dark:text-zinc-700">·</span>
                sample <span className="font-mono">{data.sampleRate}</span>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 ${STATS_PANEL} p-5`}>
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Traffic</div>
                  <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">Last 60 minutes</div>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Scaled by \(1 / sampleRate\)
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.dimensions.map((d) => (
                  <div key={d.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/30">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{d.label}</div>
                    <div className="text-4xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                      {fmt(data.totals[d.id] ?? 0)}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Last 5m: <span className="font-mono">{fmt(data.last5m[d.id] ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${STATS_PANEL} p-5`}>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Alerts</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Spike detection</div>
              {spikes.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  No spikes detected.
                </div>
              ) : (
                <ul className="space-y-3">
                  {spikes.slice(0, 8).map((s) => (
                    <li key={s.id} className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-3">
                      <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">{s.label}</div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Last 5m is ~<span className="font-mono font-semibold">{Number.isFinite(s.ratio) ? s.ratio.toFixed(1) : '∞'}×</span> baseline
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Baseline = average per-5m over the previous ~55 minutes.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${STATS_PANEL} p-6`}>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">How it works</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Interpretation</div>
              <ul className="space-y-2 kx-body">
                <li>
                  - <span className="font-black text-zinc-800 dark:text-zinc-200">Sampled & scaled</span>: edge requests are counted at a
                  sample rate and scaled by \(1 / sampleRate\). Use for trends, not billing-grade accuracy.
                </li>
                <li>
                  - <span className="font-black text-zinc-800 dark:text-zinc-200">Buckets</span>: API calls are grouped (kaspa,
                  updates, rewards, other) to keep storage cheap.
                </li>
                <li>
                  - <span className="font-black text-zinc-800 dark:text-zinc-200">Spikes</span>: last 5 minutes compared to baseline (previous
                  ~55 minutes).
                </li>
              </ul>
            </div>

            <div className={`${STATS_PANEL} p-6`}>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Runbook</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">What to do during a spike</div>
              <ol className="space-y-2 kx-body">
                <li>
                  <span className="font-black text-zinc-800 dark:text-zinc-200">1.</span> Identify which bucket spiked. If it is{' '}
                  <span className="font-mono">api.kaspa</span> or <span className="font-mono">api.rewards</span>, check upstream rate limits
                  and recent deploys.
                </li>
                <li>
                  <span className="font-black text-zinc-800 dark:text-zinc-200">2.</span> Confirm internal cron secrets are set in Vercel and
                  that protected endpoints are not public.
                </li>
                <li>
                  <span className="font-black text-zinc-800 dark:text-zinc-200">3.</span> If traffic looks abusive, add Cloudflare rate limits /
                  WAF rules for the affected paths and monitor again.
                </li>
                <li>
                  <span className="font-black text-zinc-800 dark:text-zinc-200">4.</span> If it started after a deploy, suspect polling/retry
                  loops or caching changes; roll back or hotfix quickly.
                </li>
              </ol>
              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Tip: toggle <span className="font-black">Alerts On</span> to get a toast + optional browser notification.
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`${STATS_PANEL} p-6 text-sm text-zinc-600 dark:text-zinc-400`}>
          Loading counters…
        </div>
      )}
    </section>
  );
}

