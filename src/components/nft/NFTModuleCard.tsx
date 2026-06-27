'use client';

import type { NftModuleItem } from '@/lib/nft/nftModules';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

export function NFTModuleCard({ module }: { module: NftModuleItem }) {
  return (
    <KxListingCard href={module.href} accent="nftTools" className="flex flex-col h-full">
      <KxListingCardMedia aspectClass="aspect-[5/2]" className="border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-lime-500/15 dark:from-zinc-900 dark:via-zinc-950 dark:to-lime-950/35 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-lime-700 dark:text-lime-300">
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Module</span>
          </div>
        </div>
        {module.status === 'beta' ? (
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 z-20">
            Beta
          </span>
        ) : (
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-700 z-20">
            Live
          </span>
        )}
      </KxListingCardMedia>

      <KxListingCardBody className="flex flex-col flex-1">
        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-2">{module.title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 leading-relaxed">{module.description}</p>
        <span className="mt-4 text-xs font-bold uppercase tracking-wide text-lime-700 dark:text-lime-300 group-hover:text-lime-800 dark:group-hover:text-lime-200 transition-colors">
          Open module →
        </span>
      </KxListingCardBody>
    </KxListingCard>
  );
}
