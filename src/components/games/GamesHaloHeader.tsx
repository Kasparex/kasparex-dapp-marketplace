'use client';

import type { ReactNode } from 'react';
import { gameTypes, type Game } from '@/lib/games/games';
import { GAMES_GRADIENT_TEXT } from '@/lib/games/theme';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import {
  GameDeckResourceRows,
  type GameDeckResource,
} from '@/components/games/panels/GameDeckPanel';

type GamesHaloHeaderProps = {
  game: Pick<
    Game,
    'name' | 'description' | 'developer' | 'status' | 'difficulty' | 'gameType' | 'featuredImage' | 'image' | 'entryCostKAS' | 'version'
  >;
  /** Live Game Deck resources shown in the left column (Token-style header). */
  resources?: GameDeckResource[];
  /** Optional footer under deck rows (e.g. live update hint). */
  deckFooter?: ReactNode;
};

/**
 * Token-style two-column game header (above tabs).
 * Left: title, meta, Game Deck resources. Right: featured cover + status.
 */
export function GamesHaloHeader({ game, resources = [], deckFooter }: GamesHaloHeaderProps) {
  const typeName = gameTypes[game.gameType]?.name ?? game.gameType;
  const cover = game.featuredImage || game.image;

  return (
    <div
      id="game-header"
      className="relative mb-4 scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 select-text dark:border-zinc-800 dark:bg-zinc-900/45"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-transparent" />

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Kasparex Games · {typeName}
              </p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-zinc-900 dark:text-white sm:text-4xl">
                <span className={GAMES_GRADIENT_TEXT}>{game.name}</span>
              </h1>
              <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                by {game.developer}
                {game.version ? ` · v${game.version}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              {game.status}
            </span>
          </div>

          {game.description ? (
            <p className="kx-body mb-5 max-w-2xl select-text">{game.description}</p>
          ) : null}

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
              {typeName}
            </span>
            <span className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold capitalize text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
              {game.difficulty}
            </span>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Entry {game.entryCostKAS} KAS
            </span>
          </div>

          {resources.length > 0 ? (
            <div className="mt-auto space-y-2 pt-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Game Deck</p>
                {deckFooter ? (
                  <p className="text-[10px] font-medium text-zinc-400">{deckFooter}</p>
                ) : (
                  <p className="text-[10px] font-medium text-zinc-400">Live as you play</p>
                )}
              </div>
              <GameDeckResourceRows resources={resources} />
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[220px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <KxListingFeaturedPlaceholder className="min-h-[220px] lg:min-h-full" iconClassName="h-16 w-16" />
          )}
        </div>
      </div>
    </div>
  );
}
