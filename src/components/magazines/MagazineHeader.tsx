'use client';

import { MagazineDashboardButton } from './MagazineDashboardButton';
import { AdSlider } from '@/components/ads/AdSlider';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

export function MagazineHeader() {
  return (
    <>
      <div className={`mb-6 ${HUB_HALO_MOBILE_FALLBACK}`}>
        <MagazineDashboardButton variant="header" />
      </div>
      <div
        className={`relative mb-12 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-amber-50/50 to-orange-50/40 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-amber-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
      >
        <div className="absolute inset-0 overflow-hidden opacity-90">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,var(--hub-accent),transparent_50%)] opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--hub-accent-light),transparent_50%)] opacity-20" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--hub-accent-muted)] blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-[color:var(--hub-accent-light)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--hub-accent-light)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
              </span>
              Digital Publishing
            </div>

            <h1 className="mb-6 text-4xl font-black leading-tight text-zinc-900 dark:text-white md:text-6xl">
              Kasparex{' '}
              <span className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-400 bg-clip-text text-transparent dark:from-yellow-300 dark:via-amber-300 dark:to-orange-300">
                Magazines
              </span>
            </h1>

            <p className="kx-body mb-8 max-w-2xl leading-relaxed">
              The hub for digital publications within the Kaspa ecosystem. High-quality magazines, technical deep dives, and
              community-driven content, all powered by KAS.
            </p>

            <div className="flex flex-wrap gap-4">
              <MagazineDashboardButton variant="header" />
            </div>
          </div>

          <div className="relative hidden w-[280px] flex-shrink-0 items-center justify-center lg:flex">
            <div className="pointer-events-none relative opacity-90">
              <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-[color:var(--hub-accent-border)] bg-white/80 shadow-2xl shadow-[color:var(--hub-accent-shadow)] dark:bg-zinc-900/80" />
              <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-orange-400/30 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
              <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mag</span>
              </div>
            </div>
            <div
              id="ad-slot-magazines-halo"
              className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
            >
              <AdSlider slotId="HALO_MAGAZINES_RIGHT" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
