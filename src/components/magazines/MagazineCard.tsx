'use client';

import Image from 'next/image';
import { Magazine } from '@/lib/magazines/types';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';

interface MagazineCardProps {
    magazine: Magazine;
}

export function MagazineCard({ magazine }: MagazineCardProps) {
    return (
        <KxListingCard href={`/magazines/${magazine.slug}`} accent="magazines" className="h-full flex flex-col">
            <KxListingCardMedia aspectClass="aspect-[3/4]" className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute top-4 left-4 z-20">
                        <KxBadge variant="violet-solid" className="shadow-lg">
                            {magazine.category}
                        </KxBadge>
                    </div>
                    <Image
                        src={magazine.coverImage || '/img/placeholder-magazine.jpg'}
                        alt={magazine.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                            {magazine.name}
                        </h3>
                        <p className="text-zinc-300 text-sm line-clamp-2">
                            {magazine.author}
                        </p>
                    </div>
            </KxListingCardMedia>
            <KxListingCardBody comfortable className="flex-1">
                    <p className={`mb-4 ${KX_CARD_EXCERPT}`}>
                        {magazine.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                        <span>{magazine.totalIssues} Issues</span>
                        <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
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
