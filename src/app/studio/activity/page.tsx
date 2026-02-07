'use client';

import { Activity } from '@/components/Activity';
import { useAccount } from 'wagmi';

export default function StudioActivityPage() {
    const { address } = useAccount();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-12 mb-8">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest border border-indigo-500/20">
                                    Records & History
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                                Activity Feed
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-xl">
                                Complete tracking of your on-chain and off-chain interactions within the Kasparex ecosystem.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center min-w-[200px]">
                            <span className="text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">Network Status</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="text-2xl font-black text-white tracking-tighter">
                                    CONNECTED
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-1 shadow-sm overflow-hidden">
                <div className="bg-zinc-50/50 dark:bg-white/5 p-8 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        Transaction History
                    </h3>
                </div>
                <div className="p-8">
                    {address ? (
                        <Activity walletAddress={address} />
                    ) : (
                        <div className="text-center py-20 bg-zinc-50/30 dark:bg-white/5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="text-4xl mb-4 opacity-50">🪪</div>
                            <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm">
                                Please connect your wallet to view history
                            </p>
                            <button className="mt-4 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase tracking-widest text-xs">
                                Connect Wallet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
