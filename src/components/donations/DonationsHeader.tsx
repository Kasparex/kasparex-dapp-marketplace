'use client';

import { AdSlider } from '@/components/ads/AdSlider';

export function DonationsHeader() {
  return (
    <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-emerald-50/50 to-zinc-100 dark:from-zinc-950 dark:via-emerald-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#10b981,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#059669,transparent_50%)]" />
      </div>
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            CrowdKAS
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
            Kasparex{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
              CrowdKAS
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Crowdfund creators and projects with verifiable on-chain campaigns. Contribute directly via L1, or use L2 escrow for goal-based crowdfunding with refunds.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 backdrop-blur p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-3">Ad slots</p>
          <AdSlider slotId="HALO_DONATIONS_RIGHT" />
        </div>
      </div>
    </div>
  );
}
