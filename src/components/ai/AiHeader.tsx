'use client';

import Link from 'next/link';
import { AdSlider } from '@/components/ads/AdSlider';
import { HUB_HALO_DESKTOP_ONLY } from '@/lib/hub/haloHeaders';

export function AiHeader() {
  return (
    <div
      className={`relative mb-10 scroll-mt-24 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-purple-50/50 to-cyan-50/40 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-purple-950/25 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(192,132,252,0.16),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--hub-accent-muted)] blur-3xl" />
        <div className="absolute right-12 top-8 h-32 w-32 rotate-12 rounded-2xl border border-[color:var(--hub-accent-border)]" />
        <div className="absolute bottom-12 right-1/4 h-24 w-24 -rotate-6 rounded-xl border border-cyan-400/20" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-purple-900 dark:text-[color:var(--hub-accent-light)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--hub-accent-light)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--hub-accent)]" />
            </span>
            Beta
          </div>

          <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
            Kasparex{' '}
            <span className="bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent dark:from-purple-300 dark:via-fuchsia-300 dark:to-cyan-300">
              AI
            </span>
          </h1>

          <p className="kx-body mb-8 max-w-xl leading-relaxed">
            Autonomous AI agents built on Kaspa L1 BlockDAG. Build, deploy, and monetise agent workflows with KAS, KREX, and
            future ARIA utility.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ai#create-agent" className="k-cta-primary text-xs py-2.5 px-5">
              Create Agent
            </Link>
            <Link
              href="/ai#templates"
              className="k-control-btn !border-[color:var(--hub-accent-border)] !bg-[color:var(--hub-accent-muted)] !text-[color:var(--hub-accent)]"
            >
              Explore Templates
            </Link>
            <Link href="/protocols" className="k-control-btn">
              Developer Docs
            </Link>
          </div>
        </div>

        <div className="relative hidden min-h-[200px] w-[280px] flex-shrink-0 items-center justify-center lg:flex">
          <div className="pointer-events-none relative opacity-90">
            <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-[color:var(--hub-accent-border)] bg-white/80 shadow-2xl shadow-[color:var(--hub-accent-shadow)] dark:bg-zinc-900/80" />
            <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-cyan-400/25 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
            <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Agent</span>
            </div>
          </div>
          <div
            id="ad-slot-ai-halo"
            className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
          >
            <AdSlider slotId="HALO_AI_RIGHT" />
          </div>
        </div>
      </div>
    </div>
  );
}
