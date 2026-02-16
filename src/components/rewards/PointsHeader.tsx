'use client';

import Link from 'next/link';

export function PointsHeader() {
  return (
    <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-amber-950/30 to-zinc-950 border border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.1),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Rewards & Perks
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-[#02abb8] to-amber-400">Points</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed mb-8">
            Earn XP through dApp usage, unlock perks and badges, and track your status across the ecosystem.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/rewards-calculator" className="k-cta-primary">
              Rewards Calculator
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/hub" className="k-cta-secondary">
              Go to Hub
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 opacity-90">
          <div className="relative">
            <div className="w-48 h-56 rounded-2xl border-2 border-amber-500/30 bg-zinc-900/80 shadow-2xl shadow-amber-500/10 rotate-3 transform" />
            <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-[#02abb8]/20 bg-zinc-800/90 shadow-xl -rotate-6 transform" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-700/50 flex items-center justify-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
