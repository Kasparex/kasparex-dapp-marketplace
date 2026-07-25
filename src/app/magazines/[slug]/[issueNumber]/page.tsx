'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getMagazineBySlug, getIssuesForMagazine, markIssueAsPurchased } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION } from '@/lib/rewards/types';
import { MagazineDashboardButton } from '@/components/magazines/MagazineDashboardButton';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { magazineIssueGateConfig } from '@/lib/hub/gateConfigs';
import { useHubAccess } from '@/hooks/useHubAccess';
import { useIssueManifest } from '@/hooks/useIssueManifest';
import { IssueReader } from '@/components/magazines/IssueReader';
import { DownloadIssuePdfButton } from '@/components/magazines/DownloadIssuePdfButton';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

export default function IssueDetailPage() {
    const { slug, issueNumber } = useParams();
    const router = useRouter();
    const access = useHubAccess({ layer: 'L1' });
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [issue, setIssue] = useState<MagazineIssue | null>(null);
    const [issues, setIssues] = useState<MagazineIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReader, setShowReader] = useState(false);

    const { composedSections, isLoading: manifestLoading, usingFallback } = useIssueManifest(issue);

    // Rewards Hooks
    const { balance: krexBalance, tier: krexTier } = useKREXBalance();
    const { nftStatus } = useNFTStatus();

    // Calculate discount
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

    const finalPrice = issue ? (issue.priceKAS * (1 - discountInfo.percent / 100)).toFixed(2) : '0';

    useEffect(() => {
        if (!slug || !issueNumber) return;

        const mag = getMagazineBySlug(slug as string);
        if (!mag) {
            router.push('/magazines');
            return;
        }

        setMagazine(mag);
        const magIssues = getIssuesForMagazine(mag.id);
        const foundIssue = magIssues.find(i => i.issueNumber === parseInt(issueNumber as string));

        if (!foundIssue) {
            router.push(`/magazines/${slug}`);
            return;
        }

        setIssue(foundIssue);
        setIssues(magIssues);
        setIsLoading(false);
    }, [slug, issueNumber, router]);

    const handlePurchase = async () => {
        if (!issue || !access.isOpenable) return;

        setIsProcessing(true);
        // Mock payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        markIssueAsPurchased(issue.id);
        setIssue({ ...issue, isPurchased: true });
        setShowReader(true);
        setIsProcessing(false);
    };

    if (isLoading || !magazine || !issue) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <HubAccentScope projectId="kasparex-magazines" className="flex flex-1 items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[color:var(--hub-accent)] border-t-transparent rounded-full animate-spin" />
                </HubAccentScope>
                <Footer />
            </div>
        );
    }

    const purchaseGate = { ...magazineIssueGateConfig(issue), autoPrompt: true };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <HubAccentScope projectId="kasparex-magazines" className="flex flex-1">
                <MagazinesSidebar
                    mode="issue"
                    currentMagazine={magazine}
                    issues={issues}
                    currentIssueId={issue.id}
                />

                <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white dark:bg-zinc-950">
                    <div className="w-full max-w-6xl mx-auto">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                                <Link href="/magazines" className="hover:text-[color:var(--hub-accent)] transition-colors">Magazines</Link>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <Link href={`/magazines/${magazine.slug}`} className="hover:text-[color:var(--hub-accent)] transition-colors">{magazine.name}</Link>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="text-zinc-900 dark:text-zinc-100">Issue #{issue.issueNumber}</span>
                            </div>
                            <MagazineDashboardButton variant="breadcrumb" />
                        </nav>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 mb-16">
                            {/* Issue visual */}
                            <div className="space-y-6">
                                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-[color:var(--hub-accent-shadow)] border border-zinc-200 dark:border-zinc-800">
                                    <Image
                                        src={issue.coverImage || '/img/placeholder-issue.jpg'}
                                        alt={issue.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {!issue.isPurchased && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center">
                                            <div className="text-center p-6">
                                                <svg className="w-12 h-12 text-white/50 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <p className="text-white font-bold text-lg mb-2">Content Locked</p>
                                                <p className="text-white/70 text-sm">Purchase this issue to unlock full digital access</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {issue.previewImages.map((img, i) => (
                                        <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                            <Image src={img} alt="Preview" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Issue details */}
                            <div className="flex flex-col h-full">
                                <div className="mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)] text-xs font-black uppercase tracking-widest mb-4">
                                        Issue #{issue.issueNumber} • Published {new Date(issue.publishDate).toLocaleDateString()}
                                    </div>
                                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
                                        {issue.title}
                                    </h1>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                                        {issue.description}
                                    </p>
                                </div>

                                <HubWalletGateShell config={purchaseGate} enabled={!issue.isPurchased} mode="overlay">
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Purchase Access</div>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                                    {discountInfo.hasRewards ? finalPrice : issue.priceKAS} <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">KAS</span>
                                                </div>
                                                {discountInfo.hasRewards && (
                                                    <div className="text-sm text-zinc-400 line-through font-bold">
                                                        {issue.priceKAS} KAS
                                                    </div>
                                                )}
                                            </div>
                                            {discountInfo.hasRewards && (
                                                <div className="mt-1 text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                                    </svg>
                                                    {discountInfo.percent}% Reward Discount Applied
                                                </div>
                                            )}
                                        </div>
                                        {!issue.isPurchased && (
                                            <div className="text-right">
                                                <div className="text-xs text-green-600 font-bold mb-1">On-chain Content</div>
                                                <div className="text-[10px] text-zinc-500 font-medium">Stored via CID: {issue.cid.substring(0, 10)}...</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handlePurchase}
                                        disabled={issue.isPurchased || isProcessing}
                                        className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${issue.isPurchased
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                                            : 'hub-cta-btn shadow-[color:var(--hub-accent-shadow)]'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : issue.isPurchased ? (
                                            <>
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Owned & Unlocked
                                            </>
                                        ) : (
                                            'Purchase Issue'
                                        )}
                                    </button>

                                    {issue.isPurchased && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setShowReader((v) => !v)}
                                                className="w-full mt-4 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-lg hover:opacity-90 transition-all"
                                            >
                                                {showReader ? 'Hide reader' : 'Read online'}
                                            </button>
                                            <DownloadIssuePdfButton
                                                className="mt-4"
                                                magazineName={magazine.name}
                                                issueNumber={issue.issueNumber}
                                                issueTitle={issue.title}
                                                sections={composedSections}
                                                disabled={manifestLoading || composedSections.length === 0}
                                            />
                                        </>
                                    )}
                                </div>
                                </HubWalletGateShell>

                                {/* Contributors Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
                                        Collaborators & Shares
                                    </h3>
                                    <div className="space-y-4">
                                        {issue.contributors.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                                        {c.role[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.role}</div>
                                                        <div className="text-[10px] text-zinc-500 font-mono">{c.address.substring(0, 10)}...{c.address.substring(c.address.length - 4)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-black text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)]">
                                                    {c.sharePercentage}% <span className="text-[10px] text-zinc-400 font-bold uppercase ml-1">Share</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {issue.isPurchased && showReader ? (
                            <div className="mb-16">
                                {manifestLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-10 h-10 border-4 border-[color:var(--hub-accent)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <IssueReader
                                        magazine={magazine}
                                        issue={issue}
                                        sections={composedSections}
                                        usingFallback={usingFallback}
                                    />
                                )}
                            </div>
                        ) : null}

                        {/* Discussion */}
                        <div className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-6">Discussion & Feedback</h2>
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 sm:p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                                <p className="text-zinc-500 dark:text-zinc-500 font-medium italic">Comments module coming soon...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </HubAccentScope>

            <Footer />
        </div>
    );
}
