'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

interface LevelDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    usersCount: number;
    sharePct: number;
    requirementsTxt: string;
    symbol: string;
    earningsPerUser: number;
    totalEarnings: number;
}

// Generates stable random wallets based on level and index
function generateMockUsers(level: number, count: number): string[] {
    const users: string[] = [];
    for (let i = 0; i < count; i++) {
        let address = "0x";
        for (let j = 0; j < 40; j++) {
            address += Math.floor(Math.abs(Math.sin((level * 10000) + (i * 100) + j)) * 16).toString(16);
        }
        users.push(address);
    }
    return users;
}

function formatWalletDisplay(walletAddress: string): string {
    if (!walletAddress || walletAddress.length < 10) return walletAddress;
    return `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
}

export function LevelDetailsModal({ 
    isOpen, 
    onClose, 
    level, 
    usersCount, 
    sharePct, 
    requirementsTxt, 
    symbol, 
    earningsPerUser, 
    totalEarnings 
}: LevelDetailsModalProps) {
    const displayCount = Math.min(usersCount, 100);
    const mockUsers = useMemo(() => generateMockUsers(level, displayCount), [level, displayCount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full font-black text-sm bg-[#02abb8]/10 text-[#02abb8]">
                            L{level}
                        </span>
                        Level {level} Details
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2 rounded-full transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm"
                        title="Close Modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-950">
                     <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                         <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Share Drop</div>
                         <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{sharePct}%</div>
                     </div>
                     <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                         <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Per User</div>
                         <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                            {earningsPerUser.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-xs">{symbol}</span>
                         </div>
                     </div>
                     <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                         <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Total Users</div>
                         <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">{usersCount.toLocaleString()}</div>
                     </div>
                     <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                         <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Potential</div>
                         <div className="text-lg font-black text-[#02abb8] font-mono tracking-tight">
                            +{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs">{symbol}</span>
                         </div>
                     </div>
                     <div className="col-span-2 md:col-span-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
                         <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 flex items-center gap-1.5 mb-1.5">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             Network Requirements
                         </div>
                         <div className="font-medium text-amber-900 dark:text-amber-200 text-sm">{requirementsTxt}</div>
                     </div>
                </div>

                {/* Users List Header (Fixed) */}
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-10 shrink-0">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                         Referred Users Directory
                    </h4>
                    {usersCount > 100 && (
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded-md">
                            Showing first {displayCount}
                        </span>
                    )}
                </div>

                {/* Users List Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-zinc-50 dark:bg-zinc-900 relative">
                    {mockUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
                            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="text-sm font-semibold">No users simulated on this level.</p>
                            <p className="text-xs mt-1">Increase the user count to view the directory.</p>
                        </div>
                    ) : (
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                                    <tr>
                                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Wallet Address</th>
                                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Network Flow</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {mockUsers.map((address, mIndex) => (
                                        <tr key={mIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#02abb8] to-purple-500 opacity-80 flex-shrink-0" />
                                                    <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                                                        <span className="hidden sm:inline">{address}</span>
                                                        <span className="sm:hidden">{formatWalletDisplay(address)}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right align-middle">
                                                <Link 
                                                    href={`/tree/flow/${address}`} 
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#02abb8] bg-[#02abb8]/10 hover:bg-[#02abb8] hover:text-white transition-all shadow-sm group-hover:shadow"
                                                >
                                                    View Tree
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
