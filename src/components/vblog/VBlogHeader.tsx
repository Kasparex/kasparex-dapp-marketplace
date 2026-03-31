'use client';

import { AdSlider } from '@/components/ads/AdSlider';

interface VBlogHeaderProps {
  onStartWriting?: () => void;
}

export function VBlogHeader({ onStartWriting }: VBlogHeaderProps) {
  return (
    <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-orange-50/50 to-zinc-100 dark:from-zinc-950 dark:via-orange-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#02abb8,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#00c2b2,transparent_50%)]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="min-w-0 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          On-Chain Publishing
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
          Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">vBlog</span>
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
          The decentralized voice of the Kaspa ecosystem. Every post is permanently linked to IPFS, ensuring your content is truly on-chain and community-driven.
        </p>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onStartWriting}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
          >
            Start Writing
          </button>
        </div>
        </div>
        <div
          id="ad-slot-vblog-halo"
          className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24"
        >
          <AdSlider slotId="HALO_VBLOG_RIGHT" />
        </div>
      </div>

    </div>
  );
}

