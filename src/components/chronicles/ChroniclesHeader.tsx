'use client';

import { AdSlider } from '@/components/ads/AdSlider';

export function ChroniclesHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-8 sm:p-10 mb-12">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#02abb8]/10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#02abb8] mb-2">Lore codex</p>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Krex&apos;s Chronicles
          </h1>
          <p className="mt-3 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            Wiki, story, and CMS-ready lore for Kaspaland: the narrative backbone of Kasparex.
          </p>
        </div>
        <div
          id="ad-slot-chronicles-halo"
          className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24"
        >
          <AdSlider slotId="HALO_CHRONICLES_RIGHT" />
        </div>
      </div>
    </div>
  );
}
