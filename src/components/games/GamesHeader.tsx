'use client';

import { AdSlider } from '@/components/ads/AdSlider';
import { GameSourceSwitcher } from '@/components/games/GameSourceSwitcher';
import { GAMES_GRADIENT_TEXT } from '@/lib/games/theme';
import type { GameSourceFilter } from '@/lib/games/source';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

interface GamesHeaderProps {
  sourceFilter: GameSourceFilter;
  onSourceFilterChange: (value: GameSourceFilter) => void;
}

export function GamesHeader({ sourceFilter, onSourceFilterChange }: GamesHeaderProps) {
  return (
    <>
      <div className={`mb-6 ${HUB_HALO_MOBILE_FALLBACK}`}>
        <GameSourceSwitcher value={sourceFilter} onChange={onSourceFilterChange} />
      </div>
      <div
        className={`relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-emerald-50/50 to-zinc-100 px-6 py-12 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-emerald-950/30 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.15),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.08),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.1),transparent_70%)]" />
        </div>
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Games
            </div>
            <h1 className="mb-4 text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              Kasparex <span className={GAMES_GRADIENT_TEXT}>Games</span>
            </h1>
            <p className="kx-body mb-8 max-w-xl leading-relaxed">
              Play and discover mini games across the Kaspa ecosystem, from official Kasparex titles to community-built
              experiences. Connect your wallet to earn rewards, climb leaderboards, and soon list your own games for
              others to play.
            </p>
            <GameSourceSwitcher value={sourceFilter} onChange={onSourceFilterChange} />
          </div>
          <div className="relative hidden w-[280px] flex-shrink-0 items-center justify-center lg:flex">
            <div className="pointer-events-none relative opacity-90">
              <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-emerald-500/30 bg-white/80 shadow-2xl shadow-emerald-500/10 dark:bg-zinc-900/80" />
              <div className="absolute -bottom-2 -right-2 h-48 w-40 -rotate-6 transform rounded-xl border-2 border-teal-500/20 bg-zinc-100/90 shadow-xl dark:bg-zinc-800/90" />
              <div className="absolute bottom-4 left-4 right-4 top-4 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Game</span>
              </div>
            </div>
            <div
              id="ad-slot-games-halo"
              className="pointer-events-auto absolute inset-0 flex scroll-mt-24 flex-col items-center justify-center"
            >
              <AdSlider slotId="HALO_GAMES_RIGHT" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
