'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getMagazineBySlug, getIssuesForMagazine, markIssueAsPurchased } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { useKaspaWallet } from '@/lib/kaspa/context';

export default function IssueDetailPage() {
    const { slug, issueNumber } = useParams();
    const router = useRouter();
    const { state: walletState } = useKaspaWallet();
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [issue, setIssue] = useState<MagazineIssue | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

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
        setIsLoading(false);
    }, [slug, issueNumber, router]);

    const handlePurchase = async () => {
        if (!issue) return;

        if (!walletState.isConnected) {
            alert('Please connect your Kaspa wallet first.');
            return;
        }

        setIsProcessing(true);
        // Mock payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        markIssueAsPurchased(issue.id);
        setIssue({ ...issue, isPurchased: true });
        setIsProcessing(false);
        alert(`Successfully purchased ${issue.title}!`);
    };

    if (isLoading || !magazine || !issue) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8 font-medium">
                    <Link href="/magazines" className="hover:text-cyan-500 transition-colors">Magazines</Link>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <Link href={`/magazines/${magazine.slug}`} className="hover:text-cyan-500 transition-colors">{magazine.name}</Link>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-zinc-900 dark:text-zinc-100">Issue #{issue.issueNumber}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-16">
                    {/* Issue visual */}
                    <div className="space-y-6">
                        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-zinc-200 dark:border-zinc-800">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest mb-4">
                                Issue #{issue.issueNumber} • Published {new Date(issue.publishDate).toLocaleDateString()}
                            </div>
                            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
                                {issue.title}
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                                {issue.description}
                            </p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Purchase Access</div>
                                    <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                        {issue.priceKAS} <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">KAS</span>
                                    </div>
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
                                        : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-cyan-500/20'
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
                                <button className="w-full mt-4 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-lg hover:opacity-90 transition-all">
                                    Read Online
                                </button>
                            )}
                        </div>

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
                                        <div className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                                            {c.sharePercentage}% <span className="text-[10px] text-zinc-400 font-bold uppercase ml-1">Share</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion */}
                <div className="pt-16 border-t border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-8">Discussion & Feedback</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-500 font-medium italic">Comments module coming soon...</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
