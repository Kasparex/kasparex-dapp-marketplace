'use client';

import Link from 'next/link';

export function RewardsCalculatorHeader() {
  return (
    <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-[#02abb8]/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.2),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,199,199,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,199,199,0.1),transparent_70%)] rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-cyan-700 dark:text-[#02abb8] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02abb8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#02abb8]" />
            </span>
            Simulate Rewards
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-[#02abb8] dark:to-cyan-400">Rewards Calculator</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            Simulate GRID and XP based on KAS spent, KREX tier, NFT ownership, node status, and seasonal boosters.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/rewards" className="k-cta-secondary">
              View Rewards
            </Link>
            <Link href="/points" className="k-cta-secondary">
              Points rules
            </Link>
            <Link href="/hub" className="k-cta-secondary">
              Go to Hub
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center flex-shrink-0 opacity-90">
          <div className="relative">
            <div className="w-48 h-56 rounded-2xl border-2 border-[#02abb8]/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-[#02abb8]/10 rotate-3 transform" />
            <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-cyan-500/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform flex items-center justify-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GRID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
