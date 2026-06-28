'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getMagazineBySlug, getIssuesForMagazine } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { MagazineIssueCard } from '@/components/magazines/MagazineIssueCard';
import { MagazineDashboardButton } from '@/components/magazines/MagazineDashboardButton';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';

export default function MagazineDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [issues, setIssues] = useState<MagazineIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        const mag = getMagazineBySlug(slug as string);
        if (!mag) {
            router.push('/magazines');
            return;
        }

        setMagazine(mag);
        const magIssues = getIssuesForMagazine(mag.id);
        setIssues(magIssues);
        setIsLoading(false);
    }, [slug, router]);

    if (isLoading || !magazine) {
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

            <div className="flex flex-1">
                <MagazinesSidebar
                    mode="issue"
                    currentMagazine={magazine}
                    issues={issues}
                />

                <main className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white dark:bg-zinc-950">
                    <div className="w-full">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                                <Link href="/magazines" className="hover:text-cyan-500 transition-colors">Magazines</Link>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="text-zinc-900 dark:text-zinc-100">{magazine.name}</span>
                            </div>
                            <MagazineDashboardButton variant="breadcrumb" />
                        </nav>

                        {/* Magazine Info Header */}
                        <div className="flex flex-col lg:flex-row gap-12 mb-16">
                            <div className="w-full lg:w-1/3 max-w-sm mx-auto lg:mx-0">
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-zinc-200 dark:border-zinc-800">
                                    <Image
                                        src={magazine.coverImage || '/img/placeholder-magazine.jpg'}
                                        alt={magazine.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="inline-block px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">
                                    {magazine.category}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
                                    {magazine.name}
                                </h1>
                                <p className="kx-body mb-6 leading-relaxed">
                                    {magazine.description}
                                </p>

                                <div className="flex flex-wrap gap-8 py-6 border-y border-zinc-100 dark:border-zinc-800 mb-8">
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Publisher</div>
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{magazine.author}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Availability</div>
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{magazine.totalIssues} Issues</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</div>
                                        <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </div>
                                    </div>
                                </div>

                                <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all">
                                    Follow Magazine
                                </button>
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-3">
                                Available Issues
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 font-bold">
                                    {issues.length}
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {issues.map((issue) => (
                                    <MagazineIssueCard
                                        key={issue.id}
                                        issue={issue}
                                        magazineSlug={magazine.slug}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}
