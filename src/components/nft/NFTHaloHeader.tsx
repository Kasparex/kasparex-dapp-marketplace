'use client';

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
    <section className="border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className={`relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-cyan-50/60 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/30 dark:to-zinc-950 ${isHub ? 'py-10 px-6 sm:px-8' : 'py-8 px-6 sm:px-8'}`.trim()}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(2,171,184,0.16),transparent_70%)] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(2,171,184,0.09),transparent_70%)] rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className={isHub ? 'max-w-2xl' : 'max-w-3xl'}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#017a84] dark:text-[#8ff1f8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                {isHub ? 'Kasparex NFT Tools' : 'Collection'}
              </div>
              {isHub ? (
                <>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                    Kasparex{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#02abb8] to-emerald-600 dark:from-[#5eead4] dark:to-emerald-400">
                      NFT Tools
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                    Rarity checks, trait analysis, and PFP building for premium collections - plus partner drops and
                    leaderboard context for the wider Kaspa NFT ecosystem.
                  </p>
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

            <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px]">
              <div className="relative opacity-90 pointer-events-none">
                <div className="w-48 h-56 rounded-2xl border-2 border-[#02abb8]/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-cyan-500/10 rotate-3 transform" />
                <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-emerald-500/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
                <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-300 dark:border-zinc-700/50 flex items-center justify-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">NFT</span>
                </div>
              </div>
              <div
                id="ad-slot-nft-halo"
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto scroll-mt-24"
              >
                <AdSlider slotId="HALO_NFT_RIGHT" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
