'use client';

import Link from 'next/link';

export function TokensHero() {
  return (
    <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-amber-50/40 to-zinc-100 dark:from-zinc-950 dark:via-amber-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.1),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Ecosystem Tokens
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-[#02abb8] to-amber-600 dark:from-amber-400 dark:via-[#02abb8] dark:to-amber-400">Tokens</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            Explore KREX, GRID, and all tokens across the Kasparex ecosystem. Track prices, balances, and network coverage.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#content" className="k-cta-primary">
              View Tokens
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
            <Link href="/hub" className="k-cta-secondary">
              Go to Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
