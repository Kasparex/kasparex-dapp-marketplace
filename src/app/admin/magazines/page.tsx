'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { getAllMagazines, getIssuesForMagazine } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function MagazinesAdminPage() {
    const { isAdmin, isConnected } = useAdmin();
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 4500,
        activeCreators: 12,
        pendingIssues: 2,
        platformRevenue: 225
    });

    useEffect(() => {
        const loadAdminData = async () => {
            setIsLoading(true);
            const mags = getAllMagazines();
            setMagazines(mags);
            setIsLoading(false);
        };
        loadAdminData();
    }, []);

    if (!isConnected || !isAdmin) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-3xl font-black mb-4">Magazines Admin Center</h1>
                    <p className="text-zinc-500 mb-8">Admin access required to managing publishing platform.</p>
                    <Link href="/admin" className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold">Back to Admin</Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />

            <main className="flex-1">
                <div className="flex flex-col lg:flex-row">
                    <AdminSidebar />
                    <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                                        Magazines <span className="text-emerald-500">Admin</span>
                                    </h1>
                                    <p className="text-zinc-500 text-sm">Platform-wide management of publications, splits, and IPFS assets.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Link href="/magazines/editor" className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-lg shadow-zinc-500/10">
                                        Create System Magazine
                                    </Link>
                                </div>
                            </div>

                {/* Platform Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Sales</div>
                        <div className="text-2xl font-black">{stats.totalSales} KAS</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Creators</div>
                        <div className="text-2xl font-black">{stats.activeCreators}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Treasury Revenue</div>
                        <div className="text-2xl font-black text-emerald-500">{stats.platformRevenue} KAS</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Pending Approval</div>
                        <div className="text-2xl font-black text-cyan-500">{stats.pendingIssues} Issues</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Magazine List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black">All Publications</h2>
                            <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <button className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">All</button>
                                <button className="px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Featured</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {magazines.map((mag) => (
                                <div key={mag.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                            <Image src={mag.coverImage} alt={mag.name} fill className="object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">{mag.name}</div>
                                            <div className="text-[10px] text-zinc-500 font-medium">Owner: {mag.ownerAddress.substring(0, 15)}...</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-black">{mag.totalIssues} Issues</div>
                                            <div className="text-[10px] text-zinc-400 font-bold uppercase">{mag.category}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Actions Sidebar */}
                    <div className="space-y-8">
                        <section className="bg-zinc-900 text-white p-8 rounded-3xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-4">Platform Growth</h3>
                                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Adjust global treasury shares and platform settings to incentivize creators while ensuring Kasparex sustainability.</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold font-mono">Treasury Share</span>
                                        <span className="text-xs font-black text-emerald-400">5.0%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold font-mono">KRC-20 Discount</span>
                                        <span className="text-xs font-black text-cyan-400">10.0%</span>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 bg-white text-zinc-900 rounded-xl text-xs font-black hover:bg-zinc-200 transition-all uppercase tracking-widest">Update Settings</button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                        </section>

                        <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">IPFS Health</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Gateway Online</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Pinata API Connected</span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Total pinned assets</div>
                                    <div className="text-lg font-black font-mono">154.2 MB</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
