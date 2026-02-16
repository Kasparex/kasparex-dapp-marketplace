'use client';

export function VBlogHeader() {
  return (
    <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-orange-50/50 to-zinc-100 dark:from-zinc-950 dark:via-orange-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#02abb8,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#00c2b2,transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-4xl">
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
          <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">
            Start Writing
          </button>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center opacity-30">
        <div className="relative w-64 h-80 rounded-2xl border-2 border-orange-500/30 transform -rotate-12 -translate-x-12 translate-y-12 shadow-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-8">
          <div className="w-full space-y-3">
            <div className="h-2 w-full bg-zinc-300 dark:bg-zinc-800 rounded"></div>
            <div className="h-2 w-3/4 bg-zinc-300 dark:bg-zinc-800 rounded"></div>
            <div className="h-2 w-full bg-zinc-300 dark:bg-zinc-800 rounded"></div>
            <div className="h-2 w-1/2 bg-zinc-300 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
        <div className="relative w-64 h-80 rounded-2xl border-2 border-amber-500/30 transform rotate-6 shadow-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex flex-col p-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="text-amber-500 text-xs font-black mb-1">DECENTRALIZED BLOGGING</div>
          <div className="text-zinc-500 text-[10px] leading-relaxed">Powered by IPFS & Kaspa</div>
        </div>
      </div>
    </div>
  );
}

