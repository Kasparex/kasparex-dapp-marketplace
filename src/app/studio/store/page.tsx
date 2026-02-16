'use client';

import { StoreProductForm } from '@/components/store/StoreProductForm';

export default function StudioStorePage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-emerald-50/30 to-zinc-100 dark:from-zinc-950 dark:via-emerald-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-widest border border-emerald-500/20">
                                    Hub Store
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">
                                List Product
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl">
                                Bring your digital assets to market. Sell software, art, or services and earn KAS directly.
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <div className="p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" /></svg>
                                </div>
                                <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                    Global Marketplace
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                <StoreProductForm />
            </div>
        </div>
    );
}
