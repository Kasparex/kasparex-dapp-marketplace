'use client';

import { useState } from 'react';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { useChainId } from 'wagmi';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';

const LEVEL_SHARES = [
    REVENUE_SHARE_PERCENTAGES.LEVEL_01,
    REVENUE_SHARE_PERCENTAGES.LEVEL_02,
    REVENUE_SHARE_PERCENTAGES.LEVEL_03,
    REVENUE_SHARE_PERCENTAGES.LEVEL_04,
    REVENUE_SHARE_PERCENTAGES.LEVEL_05,
];

export function RevenueTreeSimulator() {
    const chainId = useChainId();
    const symbol = getNativeCurrencySymbol(chainId);

    // State for the calculator
    const [averageSpend, setAverageSpend] = useState<string>('100');
    const [levelUsers, setLevelUsers] = useState<number[]>([10, 50, 100, 250, 500]);

    const handleUserChange = (index: number, value: string) => {
        const newUsers = [...levelUsers];
        newUsers[index] = parseInt(value) || 0;
        setLevelUsers(newUsers);
    };

    const spendAmount = parseFloat(averageSpend) || 0;

    let totalEarnings = 0;
    let totalUsers = 0;

    return (
        <div className="rounded-xl border border-[#02abb8]/30 dark:border-[#02abb8]/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Revenue Tree Calculator
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                            Simulate your potential earnings by estimating the number of active users in your downline and their average dApp spend.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor="simulateAmount" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Avg Spend:
                        </label>
                        <div className="relative">
                            <input
                                id="simulateAmount"
                                type="number"
                                min="0"
                                step="1"
                                value={averageSpend}
                                onChange={(e) => setAverageSpend(e.target.value)}
                                className="w-24 sm:w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">{symbol}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
                            <th className="pb-3 font-medium">Level</th>
                            <th className="pb-3 font-medium">Share %</th>
                            <th className="pb-3 font-medium">Earnings per User</th>
                            <th className="pb-3 font-medium w-32">Referred Users</th>
                            <th className="pb-3 font-medium text-right">Potential Earnings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {LEVEL_SHARES.map((pct, idx) => {
                            const level = idx + 1;
                            const users = levelUsers[idx];
                            const perUser = (spendAmount * pct) / 100;
                            const levelEarnings = perUser * users;

                            totalEarnings += levelEarnings;
                            totalUsers += users;

                            return (
                                <tr key={level} className="text-sm">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs bg-[#02abb8]/10 text-[#02abb8]">
                                                L{level}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                                    <td className="py-4 font-mono text-zinc-600 dark:text-zinc-400">
                                        {perUser.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
                                    </td>
                                    <td className="py-4">
                                        <input
                                            type="number"
                                            min="0"
                                            value={users || ''}
                                            onChange={(e) => handleUserChange(idx, e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                                        />
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="font-bold text-[#02abb8]">
                                            +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                            <td colSpan={3} className="pt-4 font-bold text-zinc-900 dark:text-white">Total Estimated Network:</td>
                            <td className="pt-4 font-bold text-zinc-900 dark:text-white">{totalUsers.toLocaleString()} Users</td>
                            <td className="pt-4 text-right font-black text-xl text-[#02abb8]">
                                +{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
