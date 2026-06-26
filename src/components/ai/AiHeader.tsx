'use client';

import Link from 'next/link';

export function AiHeader() {
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
            Beta
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            Kasparex{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300">
              AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            Autonomous AI agents built on Kaspa L1 BlockDAG. Build, deploy, and monetise agent workflows with KAS, KREX, and future ARIA utility.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ai#create-agent" className="k-cta-primary text-xs py-2.5 px-5">
              Create Agent
            </Link>
            <Link
              href="/ai#templates"
              className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300"
            >
              Explore Templates
            </Link>
            <Link href="/protocols" className="k-control-btn">
              Developer Docs
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[240px] min-h-[200px]">
          <div className="relative w-full h-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <span className="text-3xl font-black text-cyan-600 dark:text-cyan-300">K</span>
              </div>
            </div>
            <div className="absolute top-2 right-4 w-8 h-8 rounded-lg border border-emerald-400/30 bg-emerald-500/10 rotate-12" />
            <div className="absolute bottom-4 left-2 w-6 h-6 rounded-md border border-violet-400/30 bg-violet-500/10 -rotate-6" />
            <div className="absolute top-1/2 right-0 w-5 h-5 rounded border border-cyan-400/40 bg-cyan-500/15 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
