'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import Link from 'next/link';

export function StoreHeader() {
  return (
    <div className="scroll-mt-24 relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.12),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-8 right-12 w-32 h-32 border border-cyan-500/20 rounded-2xl rotate-12" />
        <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-emerald-400/15 rounded-xl -rotate-6" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-800 dark:text-cyan-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Digital Asset Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Kasparex{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300">
              Store
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            The premier destination for digital assets on Kaspa. Discover exclusive software, art, music, and templates, secured by the blockDAG.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/store/dashboard"
              className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300"
            >
              Seller Dashboard
            </Link>
            <Link href="/store/create" className="k-control-btn !border-emerald-500/30 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300">
              List a product
            </Link>
            <Link href="/store/dashboard?tab=purchased" className="k-control-btn">
              My Purchases
            </Link>
          </div>
        </div>

        <div
          id="ad-slot-store-halo"
          className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24"
        >
          <AdSlider slotId="HALO_STORE_RIGHT" />
        </div>
      </div>
    </div>
  );
}
