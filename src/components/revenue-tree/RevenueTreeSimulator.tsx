'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import type { UnifiedRevenueTreeData } from '@/lib/revenue-tree/types';

interface RevenueTreeSimulatorProps {
    tree: UnifiedRevenueTreeData | null;
    /** Whether the real network tree is still loading */
    isLoading: boolean;
}

const LEVEL_SHARES = [
    REVENUE_SHARE_PERCENTAGES.LEVEL_01,
    REVENUE_SHARE_PERCENTAGES.LEVEL_02,
    REVENUE_SHARE_PERCENTAGES.LEVEL_03,
    REVENUE_SHARE_PERCENTAGES.LEVEL_04,
    REVENUE_SHARE_PERCENTAGES.LEVEL_05,
];

const PLATFORM_SHARE = 18;

function formatAddr(addr: string | undefined): string {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'Genesis';
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function RevenueTreeSimulator({ tree, isLoading }: RevenueTreeSimulatorProps) {
    const { address } = useAccount();
    const [simulateAmount, setSimulateAmount] = useState<string>('100');

    const chainId = tree?.chainId ?? 167012;
    const symbol = getNativeCurrencySymbol(chainId);
    const amountParsed = parseFloat(simulateAmount) || 0;

    // Render a skeleton if loading real data
    if (isLoading) {
        return (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If no tree exists (not connected or network not supported)
    if (!tree && !address) {
        return null; // Hide completely if not connected, rely on the main dashboard warning
    }

    const isActivated = tree?.activatedAt !== null;

    return (
        <div className="rounded-xl border border-[#02abb8]/30 dark:border-[#02abb8]/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">

            {/* Header section */}
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Payment Simulator
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                            See exactly where your KAS goes when you pay for dApps, Magazines, or Games.
                            Only active upline wallets receive KAS. Inactive slots redirect to Genesis.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor="simulateAmount" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Simulate:
                        </label>
                        <div className="relative">
                            <input
                                id="simulateAmount"
                                type="number"
                                min="0"
                                step="1"
                                value={simulateAmount}
                                onChange={(e) => setSimulateAmount(e.target.value)}
                                className="w-24 sm:w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">{symbol}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulator Body */}
            <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/50">

                {!isActivated && (
                    <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Not Activated Yet:</span> You have not reached the {tree?.activationThreshold ? parseFloat(tree.activationThreshold) / 1e18 : 100} KAS activation threshold. All payments track toward activation while distributing to Genesis.
                    </div>
                )}

                {/* Tree Flow Visualisation */}
                <div className="space-y-3">
                    {LEVEL_SHARES.map((pct, idx) => {
                        const level = idx + 1;
                        const rawWallet = tree?.upline[idx];
                        const isRealWallet = rawWallet && rawWallet !== '0x0000000000000000000000000000000000000000';

                        // If they haven't activated, Genesis receives.
                        // If activated but the upline wallet is inactive, Genesis receives.
                        const isActiveNode = tree?.isActiveAtLevel[idx] ?? false;
                        const goesToGenesis = !isActivated || !isRealWallet || !isActiveNode;

                        const amountOut = (amountParsed * pct) / 100;

                        return (
                            <div key={level} className={`relative flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg border transition-colors ${goesToGenesis ? 'bg-zinc-100/50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800/50' : 'bg-white dark:bg-zinc-800/80 border-[#02abb8]/20 shadow-sm'}`}>

                                {/* Level Badge */}
                                <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-black text-sm ${goesToGenesis ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400' : 'bg-[#02abb8]/10 text-[#02abb8]'}`}>
                                    L{level}
                                </div>

                                {/* Middle: Data */}
                                <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 overflow-hidden text-center sm:text-left">
                                    <div>
                                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                                            {pct}% Share
                                            {goesToGenesis && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">Rerouted</span>}
                                        </div>

                                        <div className="text-xs sm:text-sm font-mono truncate w-full flex flex-col sm:flex-row items-center sm:gap-2">
                                            {goesToGenesis ? (
                                                <>
                                                    <span className="text-zinc-400 dark:text-zinc-500 line-through">
                                                        {isRealWallet ? formatAddr(rawWallet) : 'No user'}
                                                    </span>
                                                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">→</span>
                                                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold mt-1 sm:mt-0">
                                                        Genesis L{level}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-zinc-700 dark:text-zinc-300">
                                                    {formatAddr(rawWallet)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Currency amount */}
                                    <div className="mt-2 sm:mt-0 shrink-0 font-bold text-lg tabular-nums flex flex-col items-end">
                                        <div className="flex items-center">
                                            <span className={goesToGenesis ? 'text-zinc-500 dark:text-zinc-400' : 'text-[#02abb8]'}>
                                                {amountOut > 0 ? `+${amountOut.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '0'}
                                            </span>
                                            <span className={`text-xs ml-1 ${goesToGenesis ? 'text-zinc-400' : 'text-[#02abb8]/70'}`}>{symbol}</span>
                                        </div>
                                        {/* Added Potential Earnings */}
                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                            Potential Earnings: {amountOut > 0 ? `+${amountOut.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '0'} {symbol}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Platform Floor Reminder */}
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10">
                        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-black text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                            P
                        </div>
                        <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-center sm:text-left">
                            <div>
                                <div className="font-semibold text-purple-900 dark:text-purple-100">
                                    Platform ({PLATFORM_SHARE}%)
                                </div>
                                <div className="text-xs font-mono text-purple-600/70 dark:text-purple-400/70">
                                    Kasparex Treasury
                                </div>
                            </div>
                            <div className="font-bold text-lg tabular-nums text-purple-600 dark:text-purple-400">
                                +{((amountParsed * PLATFORM_SHARE) / 100).toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-xs opacity-70">{symbol}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
