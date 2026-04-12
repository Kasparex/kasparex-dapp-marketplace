'use client';

import Image from 'next/image';
import { Magazine } from '@/lib/magazines/types';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholder } from '@/components/kx/KxListingCardPlaceholder';

interface MagazineCardProps {
    magazine: Magazine;
}

export function MagazineCard({ magazine }: MagazineCardProps) {
    const hasCover = Boolean(magazine.coverImage?.trim());

    return (
        <KxListingCard href={`/magazines/${magazine.slug}`} accent="magazines" className="h-full flex flex-col">
            <KxListingCardMedia aspectClass="aspect-[3/4]">
                {hasCover ? (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-3 left-3 z-20">
                            <span className="px-3 py-1 bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                                {magazine.category}
                            </span>
                        </div>
                        <Image
                            src={magazine.coverImage!}
                            alt={magazine.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute bottom-3 left-3 right-3 z-20">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                                {magazine.name}
                            </h3>
                            <p className="text-zinc-300 text-sm line-clamp-2">
                                {magazine.author}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-3 left-3 z-20">
                            <span className="px-3 py-1 bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                                {magazine.category}
                            </span>
                        </div>
                        <KxListingCardPlaceholder />
                    </>
                )}
            </KxListingCardMedia>
            <KxListingCardBody comfortable>
                {!hasCover ? (
                    <>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {magazine.name}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">{magazine.author}</p>
                    </>
                ) : null}
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">
                    {magazine.description}
                </p>
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mt-auto">
                    <span>{magazine.totalIssues} Issues</span>
                    <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                        View Issues
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </KxListingCardBody>
        </KxListingCard>
    );
}
