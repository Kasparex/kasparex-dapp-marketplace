'use client';

import Image from 'next/image';
import { MagazineIssue } from '@/lib/magazines/types';
import { magazineIssueGateConfig } from '@/lib/hub/gateConfigs';
import { HubGatedListingCard } from '@/components/hub/HubGatedListingCard';
import { KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

interface MagazineIssueCardProps {
    issue: MagazineIssue;
    magazineSlug: string;
}

export function MagazineIssueCard({ issue, magazineSlug }: MagazineIssueCardProps) {
    return (
        <HubGatedListingCard
            href={`/magazines/${magazineSlug}/${issue.issueNumber}`}
            accent="magazines"
            config={magazineIssueGateConfig(issue)}
            gateWhen={!issue.isPurchased}
            className="flex flex-col h-full"
        >
            <KxListingCardMedia aspectClass="aspect-[3/4]" className="relative">
                <Image
                    src={issue.coverImage || '/img/placeholder-issue.jpg'}
                    alt={issue.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {issue.isPurchased && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold uppercase rounded-md shadow-md">
                            Owned
                        </span>
                    </div>
                )}
            </KxListingCardMedia>

            <KxListingCardBody className="flex-1 flex flex-col">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)]">
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
                    <span
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${issue.isPurchased
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                : 'bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)]'
                            }`}
                    >
                        {issue.isPurchased ? 'View' : 'Get Access'}
                    </span>
                </div>
            </KxListingCardBody>
        </HubGatedListingCard>
    );
}
