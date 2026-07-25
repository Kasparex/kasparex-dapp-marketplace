'use client';

import { useState, type ReactNode } from 'react';
import { AdSlider } from '@/components/ads/AdSlider';
import { StatsSourceSwitcher, type StatsSourceFilter } from '@/components/stats/StatsSourceSwitcher';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

export function StatsHeader({
  badge = 'Ecosystem Analytics',
  headline,
  description,
}: {
  badge?: string;
  headline: ReactNode;
  description: string;
  /** @deprecated Halo actions replaced by source filter switcher. */
  actions?: ReactNode;
}) {
  const [sourceFilter, setSourceFilter] = useState<StatsSourceFilter>('all');

  return (
    <>
      <div className={`mb-6 ${HUB_HALO_MOBILE_FALLBACK}`}>
        <StatsSourceSwitcher value={sourceFilter} onChange={setSourceFilter} />
      </div>
      <div
        className={`relative mb-10 scroll-mt-24 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-sky-50/50 to-zinc-100 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-sky-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_var(--hub-accent-muted),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.09),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.12),transparent_70%)]" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--hub-accent-muted)] blur-3xl" />
          <div className="absolute right-12 top-8 h-32 w-32 rotate-12 rounded-2xl border border-[color:var(--hub-accent-border)]" />
          <div className="absolute bottom-12 right-1/4 h-24 w-24 -rotate-6 rounded-xl border border-emerald-400/15" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-900 dark:text-[color:var(--hub-accent)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--hub-accent)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
              </span>
              {badge}
            </div>

            <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              {headline}
            </h1>

            <p className="kx-body mb-8 max-w-xl leading-relaxed">{description}</p>

            <StatsSourceSwitcher value={sourceFilter} onChange={setSourceFilter} />
          </div>

          <div
            id="ad-slot-stats-halo"
            className="relative hidden min-h-[200px] w-[280px] flex-shrink-0 scroll-mt-24 items-center justify-center lg:flex"
          >
            <AdSlider slotId="HALO_STATS_RIGHT" />
          </div>
        </div>
      </div>
    </>
  );
}
