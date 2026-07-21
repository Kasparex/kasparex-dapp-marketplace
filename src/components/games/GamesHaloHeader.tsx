'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { difficultyLevels, gameTypes, type Game } from '@/lib/games/games';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import {
  GameDeckResourceRows,
  type GameDeckResource,
} from '@/components/games/panels/GameDeckPanel';

type GamesHaloHeaderProps = {
  game: Pick<
    Game,
    | 'name'
    | 'description'
    | 'developer'
    | 'status'
    | 'difficulty'
    | 'gameType'
    | 'featuredImage'
    | 'image'
    | 'entryCostKAS'
    | 'version'
    | 'publisher'
  > & {
    categories?: string[];
    tags?: string[];
  };
  /** Live Game Deck resources shown in the left column (Token-style header). */
  resources?: GameDeckResource[];
  /** Optional footer under deck rows (e.g. live update hint). */
  deckFooter?: ReactNode;
};

function formatStatus(status: Game['status']): string {
  if (status === 'coming-soon') return 'Coming soon';
  if (status === 'maintenance') return 'Maintenance';
  if (status === 'beta') return 'Beta';
  return 'Active';
}

/**
 * Token-style two-column game header (above tabs).
 * Left: title + deck. Right: featured cover with game badges.
 */
export function GamesHaloHeader({ game, resources = [], deckFooter }: GamesHaloHeaderProps) {
  const typeName = gameTypes[game.gameType]?.name ?? game.gameType;
  const difficultyName = difficultyLevels[game.difficulty]?.name ?? game.difficulty;
  const cover = game.featuredImage || game.image;
  const publisherLabel = game.publisher === 'community' ? 'Community' : 'Kasparex';
  const categoryChips = (game.categories ?? []).filter(Boolean).slice(0, 4);
  const tagChips = (game.tags ?? []).filter(Boolean).slice(0, 6);

  return (
    <div
      id="game-header"
      className="relative mb-10 scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 select-text dark:border-zinc-800 dark:bg-zinc-900/45"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-8 sm:p-10 lg:w-1/2 lg:p-12">
          <div className="mb-6 min-w-0">
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {game.name}
            </p>
            <p className="mt-2 kx-body max-w-2xl">
              by {game.developer}
              {game.version ? ` · v${game.version}` : ''}
              {` · ${publisherLabel}`}
            </p>
          </div>

          {game.description ? (
            <p id="game-intro" className="kx-body mb-6 max-w-2xl select-text">
              {game.description}
            </p>
          ) : null}

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

        <div className="relative min-h-[260px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          {cover ? (
            <Image
              src={cover}
              alt={game.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <KxListingFeaturedPlaceholder className="min-h-[260px] lg:min-h-full" iconClassName="h-16 w-16" />
          )}

          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-2 p-4 sm:p-5">
            <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
              {formatStatus(game.status)}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-zinc-950/80 via-zinc-950/40 to-transparent p-4 pt-16 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-800">
                {typeName}
              </span>
              <span className="rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-800">
                {difficultyName}
              </span>
              <span className="rounded-lg border border-emerald-400/40 bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white">
                Entry {game.entryCostKAS} KAS
              </span>
              {categoryChips.map((cat) => (
                <span
                  key={`cat-${cat}`}
                  className="rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-800"
                >
                  {cat}
                </span>
              ))}
              {tagChips.map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className="rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
