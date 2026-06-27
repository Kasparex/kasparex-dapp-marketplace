'use client';

import Link from 'next/link';
import { AdSlider } from '@/components/ads/AdSlider';

type NFTHaloHeaderProps = {
  variant?: 'hub' | 'collection';
  collectionName?: string;
  collectionDescription?: string;
};

export function NFTHaloHeader({
  variant = 'hub',
  collectionName,
  collectionDescription,
}: NFTHaloHeaderProps) {
  const isHub = variant === 'hub';

  return (
    <div className="scroll-mt-24 relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-lime-50/40 to-zinc-100 dark:from-zinc-950 dark:via-lime-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(132,204,22,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(132,204,22,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.12),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl" />
        <div className="absolute top-8 right-12 w-32 h-32 border border-lime-500/20 rounded-2xl rotate-12" />
        <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-emerald-400/15 rounded-xl -rotate-6" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className={isHub ? 'max-w-2xl min-w-0' : 'max-w-3xl min-w-0'}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/25 text-lime-800 dark:text-lime-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            {isHub ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
                </span>
                Kasparex NFT Tools
              </>
            ) : (
              'Collection'
            )}
          </div>

          {isHub ? (
            <>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                Kasparex{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-600 via-emerald-500 to-teal-500 dark:from-lime-300 dark:via-emerald-300 dark:to-teal-300">
                  NFT Tools
                </span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
                Rarity checks, trait analysis, and PFP building for premium collections, plus partner drops and
                leaderboard context for the wider Kaspa NFT ecosystem.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/nft?tab=premium"
                  className="k-control-btn !border-lime-500/30 !bg-lime-500/10 !text-lime-800 dark:!text-lime-300"
                >
                  Browse collections
                </Link>
                <Link
                  href="/nft?tab=modules"
                  className="k-control-btn !border-emerald-500/30 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300"
                >
                  View modules
                </Link>
                <Link href="/chronicles/leaderboard#points-table" className="k-control-btn">
                  NFT slot points
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-3 leading-tight">
                {collectionName ?? 'Collection'}
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                {collectionDescription?.trim() || 'Rarity, traits, and PFP tools for this collection.'}
              </p>
            </>
          )}
        </div>

        <div
          id="ad-slot-nft-halo"
          className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px] min-h-[200px] scroll-mt-24"
        >
          <AdSlider slotId="HALO_NFT_RIGHT" />
        </div>
      </div>
    </div>
  );
}
