'use client';

import type { NftToolsRoadmapItem } from '@/lib/nft/nftToolsRoadmap';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

function statusBadge(status: NftToolsRoadmapItem['status']) {
  if (status === 'beta') {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">
        Beta
      </span>
    );
  }
  if (status === 'in-progress') {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-300 px-2 py-0.5 rounded-full border border-lime-500/30 bg-lime-500/10">
        In progress
      </span>
    );
  }
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-100/80 dark:bg-zinc-800/60">
      Planned
    </span>
  );
}

export function NFTToolCard({ item }: { item: NftToolsRoadmapItem }) {
  return (
    <KxListingCard accent="nftTools" disabled className="flex flex-col h-full">
      <KxListingCardMedia aspectClass="aspect-[5/2]" className="border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-lime-500/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-lime-950/30 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>NFT Tool</span>
          </div>
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">{item.title}</h3>
          {statusBadge(item.status)}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 leading-relaxed">{item.description}</p>
        {item.eta ? (
          <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">Target: {item.eta}</p>
        ) : null}
        <button
          type="button"
          disabled
          className="mt-4 k-control-btn opacity-60 cursor-not-allowed text-xs font-bold uppercase tracking-wide w-full justify-center"
        >
          Not yet available
        </button>
      </KxListingCardBody>
    </KxListingCard>
  );
}
