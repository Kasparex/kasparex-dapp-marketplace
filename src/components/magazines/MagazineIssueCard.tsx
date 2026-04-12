'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MagazineIssue } from '@/lib/magazines/types';
import { kxJoinClasses, kxListingAccentHoverClasses } from '@/lib/ui/kxListingAccent';

interface MagazineIssueCardProps {
    issue: MagazineIssue;
    magazineSlug: string;
}

export function MagazineIssueCard({ issue, magazineSlug }: MagazineIssueCardProps) {
    return (
        <div
            data-kx-accent="magazines"
            className={kxJoinClasses(
                'kx-listing-card bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full group shadow-kx-card transition-all duration-200',
                kxListingAccentHoverClasses('magazines'),
            )}
        >
            <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                    src={issue.coverImage || '/img/placeholder-issue.jpg'}
                    alt={issue.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {!issue.isPurchased && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                            href={`/magazines/${magazineSlug}/${issue.issueNumber}`}
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                        >
                            Learn More
                        </Link>
                    </div>
                )}
                {issue.isPurchased && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold uppercase rounded-md shadow-md">
                            Owned
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">
                    Issue #{issue.issueNumber}
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
                    {issue.title}
                </h4>
                <p className="text-zinc-500 dark:text-zinc-500 text-xs mb-4 line-clamp-2 flex-1">
                    {issue.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        {issue.priceKAS} <span className="text-[10px] text-zinc-500 font-normal">KAS</span>
                    </div>
                    <Link
                        href={`/magazines/${magazineSlug}/${issue.issueNumber}`}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${issue.isPurchased
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white'
                            }`}
                    >
                        {issue.isPurchased ? 'View' : 'Get Access'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
