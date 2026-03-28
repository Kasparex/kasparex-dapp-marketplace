'use client';

import { MagazineDashboardButton } from './MagazineDashboardButton';
import { AdSlider } from '@/components/ads/AdSlider';

export function MagazineHeader() {
    return (
        <div className="relative mb-12 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
            <div className="absolute inset-0 opacity-20 dark:opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#02abb8,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#00c2b2,transparent_50%)]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 w-full">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        Digital Publishing
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                        Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400">Magazines</span>
                    </h1>

                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
                        The hub for digital publications within the Kaspa ecosystem. High-quality magazines, technical deep dives, and community-driven content, all powered by KAS.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <MagazineDashboardButton variant="header" />
                    </div>
                </div>

                <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px]">
                    <div className="relative opacity-90 pointer-events-none">
                        <div className="w-48 h-56 rounded-2xl border-2 border-cyan-500/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-cyan-500/10 rotate-3 transform" />
                        <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-emerald-500/25 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
                        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-300 dark:border-zinc-700/50 flex items-center justify-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mag</span>
                        </div>
                    </div>
                    <div
                        id="ad-slot-magazines-halo"
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto scroll-mt-24"
                    >
                        <AdSlider slotId="HALO_MAGAZINES_RIGHT" />
                    </div>
                </div>
            </div>
        </div>
    );
}
