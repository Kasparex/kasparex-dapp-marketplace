'use client';

import Link from 'next/link';

export function StoreHeader() {
    return (
        <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-violet-50/50 to-zinc-100 dark:from-zinc-950 dark:via-violet-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
            {/* Background Gradients */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#8b5cf6,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#6366f1,transparent_50%)]" />
            </div>

            <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    Digital Asset Marketplace
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                    Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Store</span>
                </h1>

                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
                    The premier destination for digital assets on Kaspa. Discover exclusive software, art, music, and templates, secured by the blockDAG.
                </p>

                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/store/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-100 transition-colors"
                    >
                        <span>Seller Dashboard</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Artistic Element */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center opacity-40">
                <div className="relative w-64 h-80 rounded-lg border-2 border-violet-500/30 transform rotate-12 -translate-x-12 translate-y-12 shadow-2xl overflow-hidden bg-white dark:bg-transparent">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
                    <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border border-zinc-400 dark:border-zinc-700 rounded" />
                </div>
                <div className="relative w-64 h-80 rounded-lg border-2 border-indigo-500/30 transform -rotate-6 shadow-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800" />
                    <div className="absolute top-6 left-6 text-zinc-500 text-xs font-bold">KREX STORE</div>
                    {/* Decorative Grid */}
                    <div className="absolute bottom-0 right-0 p-6 opacity-20">
                        <div className="grid grid-cols-3 gap-2">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
