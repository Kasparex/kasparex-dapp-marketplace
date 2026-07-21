'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getAllMagazines, getIssuesForMagazine, getPurchasedIssueIds, getMagazinesByOwner } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import Link from 'next/link';
import { MagazineIssueCard } from '@/components/magazines/MagazineIssueCard';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import Image from 'next/image';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION } from '@/lib/rewards/types';
import { TierBadge } from '@/components/rewards/TierBadge';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { MAGAZINES_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';

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

    const { balance: krexBalance, tier: krexTier } = useKREXBalance();
    const { nftStatus } = useNFTStatus();

    const discountInfo = (() => {
        let totalDiscount = 0;
        const tierConfig = KREX_TIERS[krexTier];

        if (krexBalance > 0) {
            totalDiscount += tierConfig.costReduction;
        }

        if (nftStatus?.hasRarestNFT) {
            totalDiscount += RAREST_NFT_COST_REDUCTION;
        } else if (nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX) {
            totalDiscount += DIAMOND_NFT_COST_REDUCTION;
        } else if (nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX) {
            totalDiscount += NFT_COST_REDUCTION;
        }

        return {
            percent: Math.min(50, totalDiscount),
            hasRewards: totalDiscount > 0
        };
    })();

    if (!walletState.isConnected) {
        return (
            <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-lg w-full">
                        <MobileDesktopOnlyGate title="Magazines Dashboard" backHref="/magazines" backLabel="Back to Magazines">
                        <HubWalletGateShell mode="replace" config={MAGAZINES_DASHBOARD_GATE}>
                            <div />
                        </HubWalletGateShell>
                        </MobileDesktopOnlyGate>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />

            <div className="flex flex-1">
                <MagazinesSidebar mode="utility" />

                <main className="flex-1 w-full overflow-y-auto bg-zinc-100/60 p-4 sm:p-6 lg:p-12 dark:bg-zinc-950">
                    <MobileDesktopOnlyGate title="Magazines Dashboard" backHref="/magazines" backLabel="Back to Magazines">
                    <div className="w-full">
                        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                                Magazines <span className="text-cyan-500">Dashboard</span>
                            </h1>
                            <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                {walletState.address}
                            </div>
                        </div>

                        {/* Dashboard Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 rounded-2xl w-fit mb-8 border border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setActiveTab('reader')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'reader'
                                    ? 'k-tab-btn-active bg-zinc-100 dark:bg-zinc-800 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                Reader Library
                            </button>
                            <button
                                onClick={() => setActiveTab('creator')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'creator'
                                    ? 'k-tab-btn-active bg-zinc-100 dark:bg-zinc-800 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                Creator Center
                            </button>
                            <button
                                onClick={() => setActiveTab('revenue')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'revenue'
                                    ? 'k-tab-btn-active bg-zinc-100 dark:bg-zinc-800 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                Revenue & Splits
                            </button>
                        </div>

                        {/* Rewards Status Card */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-8 mb-8 border border-zinc-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="text-xl font-black">My Rewards & Benefits</h2>
                                        <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} />
                                    </div>
                                    <p className="text-zinc-400 text-sm max-w-md">
                                        Your KREX holdings and NFT ownership unlock exclusive discounts and perks across the Kasparex Magazines platform.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Magazine Discount</div>
                                        <div className="text-2xl font-black text-emerald-400">{discountInfo.percent}% OFF</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Assets</div>
                                        <div className="text-2xl font-black text-cyan-400">
                                            {(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX) ? 'NFT Enabled' : '0 NFTs'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Issue fee</div>
                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">50 KAS</div>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Premium modules</div>
                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">+12 KAS each</div>
                          </div>
                          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/25">
                            <div className="text-[10px] font-black text-cyan-800 uppercase tracking-widest mb-1">Hub points</div>
                            <div className="text-2xl font-black text-cyan-900 dark:text-cyan-100">+75 pts</div>
                          </div>
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
                                                <p className="text-zinc-500 mb-6">You haven&apos;t purchased any magazines yet.</p>
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
                                                <p className="text-zinc-500 mb-6">You don&apos;t own any magazines yet. Start your own digital publication.</p>
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
                    </div>
                    </MobileDesktopOnlyGate>
                </main>
            </div>

            <Footer />
        </div>
    );
}
