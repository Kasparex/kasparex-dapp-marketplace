'use client';

import { Activity } from '@/components/Activity';
import { useAccount } from 'wagmi';

export default function StudioActivityPage() {
    const { address } = useAccount();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                        Activity Feed
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
                        Complete tracking of your on-chain and off-chain interactions within the Kasparex ecosystem.
                    </p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-1">Network Status</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter italic">
                            CONNECTED
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm overflow-hidden">
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
