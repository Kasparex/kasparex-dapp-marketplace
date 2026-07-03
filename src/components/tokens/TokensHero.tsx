'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import { TokenSourceSwitcher } from '@/components/tokens/TokenSourceSwitcher';
import { TOKENS_GRADIENT_TEXT } from '@/lib/tokens/theme';
import type { TokenSourceFilter } from '@/lib/tokens/source';

interface TokensHeroProps {
  sourceFilter: TokenSourceFilter;
  onSourceFilterChange: (value: TokenSourceFilter) => void;
}

export function TokensHero({ sourceFilter, onSourceFilterChange }: TokensHeroProps) {
  return (
    <div className="relative mb-8 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-8 right-12 w-32 h-32 border border-cyan-500/20 rounded-2xl rotate-12 hidden sm:block" />
        <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-cyan-400/15 rounded-xl -rotate-6 hidden sm:block" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-800 dark:text-cyan-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Utility Hub
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Kasparex <span className={TOKENS_GRADIENT_TEXT}>Tokens</span>
          </h1>
          <p className="kx-body max-w-xl leading-relaxed mb-8">
            Discover ecosystem tokens, track balances, and find projects with live Kasparex Hub utility.
            Build modular landing pages and connect real use cases for your community.
          </p>
          <TokenSourceSwitcher value={sourceFilter} onChange={onSourceFilterChange} />
        </div>
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px]">
          <div className="relative opacity-90 pointer-events-none">
            <div className="w-48 h-56 rounded-2xl border-2 border-cyan-500/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-cyan-500/10 rotate-3 transform" />
            <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-teal-500/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-300 dark:border-zinc-700/50 flex items-center justify-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Token</span>
            </div>
          </div>
          <div
            id="ad-slot-tokens-halo"
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto scroll-mt-24"
          >
            <AdSlider slotId="HALO_TOKENS_RIGHT" />
          </div>
        </div>
      </div>
    </div>
  );
}
