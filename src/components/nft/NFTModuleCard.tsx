'use client';

import type { NftModuleItem } from '@/lib/nft/nftModules';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';

export function NFTModuleCard({ module }: { module: NftModuleItem }) {
  return (
    <KxListingCard href={module.href} accent="nftTools" className="flex flex-col h-full">
      <KxListingCardMedia aspectClass="aspect-video" className="border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-lime-500/15 dark:from-zinc-900 dark:via-zinc-950 dark:to-lime-950/35 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-lime-700 dark:text-lime-300">
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Module</span>
          </div>
        </div>
        {module.status === 'beta' ? (
          <span className="absolute top-3 left-3 z-20">
            <KxBadge variant="violet">Beta</KxBadge>
          </span>
        ) : (
          <span className="absolute top-3 left-3 z-20">
            <KxBadge variant="emerald">Live</KxBadge>
          </span>
        )}
      </KxListingCardMedia>

      <KxListingCardBody className="flex flex-col flex-1">
        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-2">{module.title}</h3>
        <p className="kx-body flex-1 leading-relaxed">{module.description}</p>
        <span className="mt-4 text-xs font-bold uppercase tracking-wide text-lime-700 dark:text-lime-300 group-hover:text-lime-800 dark:group-hover:text-lime-200 transition-colors">
          Open module →
        </span>
      </KxListingCardBody>
    </KxListingCard>
  );
}
