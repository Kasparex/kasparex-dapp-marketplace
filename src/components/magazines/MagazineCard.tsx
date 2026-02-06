'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Magazine } from '@/lib/magazines/types';

interface MagazineCardProps {
    magazine: Magazine;
}

export function MagazineCard({ magazine }: MagazineCardProps) {
    return (
        <Link href={`/magazines/${magazine.slug}`} className="group">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute top-4 left-4 z-20">
                        <span className="px-3 py-1 bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                            {magazine.category}
                        </span>
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
                </div>
                <div className="p-5">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">
                        {magazine.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                        <span>{magazine.totalIssues} Issues</span>
                        <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                            View Issues
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
