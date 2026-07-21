'use client';

import { gameTypes, type Game } from '@/lib/games/games';
import { GAMES_GRADIENT_TEXT } from '@/lib/games/theme';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';

type GamesHaloHeaderProps = {
  game: Pick<
    Game,
    'name' | 'description' | 'developer' | 'status' | 'difficulty' | 'gameType' | 'featuredImage' | 'image' | 'entryCostKAS' | 'version'
  >;
};

/**
 * Two-column Halo header for individual game pages (above tabs).
 * Left: game info deck / metadata. Right: featured image + status badge.
 */
export function GamesHaloHeader({ game }: GamesHaloHeaderProps) {
  const typeName = gameTypes[game.gameType]?.name ?? game.gameType;
  const cover = game.featuredImage || game.image;

  return (
    <>
      <div className={`mb-4 ${HUB_HALO_MOBILE_FALLBACK}`}>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          {typeName} · {game.status}
        </p>
        <h1 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">{game.name}</h1>
      </div>

      <section
        className={`relative mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-emerald-50/50 to-zinc-100 px-5 py-8 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-emerald-950/30 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 h-[80%] w-[60%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[60%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.08),transparent_70%)] blur-3xl" />
        </div>

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="min-w-0 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Kasparex Games
            </div>
            <h1 className="text-3xl font-black leading-tight text-zinc-900 dark:text-white sm:text-4xl md:text-5xl">
              <span className={GAMES_GRADIENT_TEXT}>{game.name}</span>
            </h1>
            <p className="kx-body max-w-xl text-base leading-relaxed sm:text-lg">
              {game.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                {typeName}
              </span>
              <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold capitalize text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                {game.difficulty}
              </span>
              <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                by {game.developer}
              </span>
              {game.version ? (
                <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                  v{game.version}
                </span>
              ) : null}
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Entry {game.entryCostKAS} KAS
              </span>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/80">
            <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-800">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Game art
                </div>
              )}
              <span className="absolute right-3 top-3 rounded-lg border border-emerald-500/40 bg-emerald-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                {game.status}
              </span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
