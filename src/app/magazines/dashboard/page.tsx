'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllMagazines, getIssuesForMagazine, getPurchasedIssueIds, getMagazinesByOwner } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { MagazineCard } from '@/components/magazines/MagazineCard';
import { MagazineIssueCard } from '@/components/magazines/MagazineIssueCard';
import Link from 'next/link';

export default function MagazinesDashboardPage() {
    const { state: walletState } = useKaspaWallet();
    const [ownedIssues, setOwnedIssues] = useState<MagazineIssue[]>([]);
    const [myMagazines, setMyMagazines] = useState<Magazine[]>([]);
    const [activeTab, setActiveTab] = useState<'reader' | 'creator' | 'revenue'>('reader');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            setIsLoading(true);
            const magazines = getAllMagazines();
            const purchasedIds = getPurchasedIssueIds();

            // Load owned issues
            const allOwned: MagazineIssue[] = [];
            for (const mag of magazines) {
                const issues = getIssuesForMagazine(mag.id);
                const owned = issues.filter(i => purchasedIds.includes(i.id));
                allOwned.push(...owned);
            }
            setOwnedIssues(allOwned);

            // Load my magazines (if connected)
            if (walletState.isConnected && walletState.address) {
                const ownedMags = getMagazinesByOwner(walletState.address);
                setMyMagazines(ownedMags);
            }

            setIsLoading(false);
        };

        loadDashboard();
    }, [walletState.isConnected, walletState.address]);

    const totalRevenue = useMemo(() => {
        // Mock revenue calculation: 95% of (price * mock sales)
        // In a real app, this would come from on-chain indexer
        return myMagazines.length * 450;
    }, [myMagazines]);

    if (!walletState.isConnected) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-4">Connect Your Wallet</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
                        View your purchased magazines, manage your own publications, and track your revenue shares by connecting your Kaspa wallet.
                    </p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                        Magazines <span className="text-cyan-500">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {walletState.address}
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit mb-12 border border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => setActiveTab('reader')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'reader'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        Reader Library
                    </button>
                    <button
                        onClick={() => setActiveTab('creator')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'creator'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        Creator Center
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'revenue'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        Revenue & Splits
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'reader' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Your Collection</h2>
                                    <div className="text-sm font-bold text-zinc-500">{ownedIssues.length} Issues Owned</div>
                                </div>

                                {ownedIssues.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {ownedIssues.map((issue) => (
                                            <MagazineIssueCard
                                                key={issue.id}
                                                issue={issue}
                                                magazineSlug={getAllMagazines().find(m => m.id === issue.id.split('-').slice(0, -1).join('-'))?.slug || ''}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                                        <p className="text-zinc-500 mb-6">You haven't purchased any magazines yet.</p>
                                        <Link href="/magazines" className="inline-flex px-8 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-all">
                                            Explore Magazines
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'creator' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">My Publications</h2>
                                    <Link href="/magazines/editor" className="inline-flex px-6 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl text-sm font-bold hover:shadow-lg shadow-cyan-500/20 transition-all">
                                        + Create New Issue
                                    </Link>
                                </div>

                                {myMagazines.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {myMagazines.map((mag) => (
                                            <div key={mag.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex gap-6">
                                                <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0">
                                                    <Image src={mag.coverImage} alt={mag.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 truncate mb-1">{mag.name}</h3>
                                                    <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{mag.description}</p>
                                                    <div className="flex items-center gap-4">
                                                        <button className="text-xs font-bold text-cyan-500 hover:text-cyan-600">Edit Settings</button>
                                                        <button className="text-xs font-bold text-zinc-500 hover:text-zinc-700">View Issues</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                                        <p className="text-zinc-500 mb-6">You don't own any magazines yet. Start your own digital publication.</p>
                                        <button className="inline-flex px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-all">
                                            Launch New Magazine
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'revenue' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Earnings</div>
                                        <div className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{totalRevenue} KAS</div>
                                        <div className="text-[10px] text-green-500 font-bold mt-2">+12% from last month</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Platform Fees (5%)</div>
                                        <div className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{(totalRevenue * 0.05).toFixed(0)} KAS</div>
                                        <div className="text-[10px] text-zinc-400 font-bold mt-2">Allocated to Kasparex Treasury</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Your Active Splits</div>
                                        <div className="text-4xl font-black text-emerald-500">{myMagazines.length + 2}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold mt-2">Across all publications</div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 font-bold">Recent Distribution History</div>
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black text-xs">K</div>
                                                    <div>
                                                        <div className="font-bold">Sale: Kaspa Insider #1</div>
                                                        <div className="text-xs text-zinc-500">Transaction confirmed • 2 hours ago</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-green-500">+1.5 KAS</div>
                                                    <div className="text-[10px] font-bold text-zinc-400">Your Share (15%)</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

import Image from 'next/image';
