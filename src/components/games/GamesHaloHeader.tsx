'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { difficultyLevels, gameTypes, type Game } from '@/lib/games/games';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import {
  GameDeckResourceRows,
  type GameDeckResource,
} from '@/components/games/panels/GameDeckPanel';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { KASPAREX_GAMES_AUTHOR_SEED } from '@/lib/hub/hubProjectAccent';

type GamesHaloHeaderProps = {
  game: Pick<
    Game,
    | 'name'
    | 'developer'
    | 'status'
    | 'difficulty'
    | 'gameType'
    | 'featuredImage'
    | 'image'
    | 'version'
    | 'publisher'
    | 'authorAddress'
  > & {
    categories?: string[];
    tags?: string[];
  };
  /** Live Game Deck resources shown in the left column. */
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
 * Two-column game header (above tabs).
 * Left: kicker + tilt title, author, badges, Game Deck. Right: featured cover only.
 */
export function GamesHaloHeader({ game, resources = [], deckFooter }: GamesHaloHeaderProps) {
  const typeName = gameTypes[game.gameType]?.name ?? game.gameType;
  const difficultyName = difficultyLevels[game.difficulty]?.name ?? game.difficulty;
  const cover = game.featuredImage || game.image;
  const authorSeed =
    game.authorAddress?.trim() ||
    (game.publisher === 'community'
      ? `author:${game.developer}`
      : KASPAREX_GAMES_AUTHOR_SEED);

  /** Max 3–4 game-related chips. No entry-cost badge. */
  const badges: { key: string; label: string; accent?: boolean }[] = [
    { key: 'status', label: formatStatus(game.status), accent: true },
    { key: 'type', label: typeName },
    { key: 'difficulty', label: difficultyName },
  ];
  const extra = [...(game.categories ?? []), ...(game.tags ?? []).map((t) => `#${t}`)].filter(Boolean);
  for (const label of extra) {
    if (badges.length >= 4) break;
    badges.push({ key: `extra-${label}`, label });
  }

  return (
    <div
      id="game-header"
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 select-text dark:border-zinc-800 dark:bg-zinc-900/45"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--hub-accent-muted,rgba(16,185,129,0.1))] via-transparent to-transparent" />

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--hub-accent,#10b981)]">
            Kasparex Games · {typeName}
          </p>

          <div className="mb-3 flex items-center gap-3">
            <span className="hub-tilt-bar h-7 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
            <h1 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {game.name}
            </h1>
          </div>

          <AuthorInline
            address={authorSeed}
            displayName={game.developer}
            href={`/u/${encodeURIComponent(authorSeed)}`}
            className="mb-4"
          />

          <div className="mb-5 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.key}
                className={
                  b.accent
                    ? 'rounded-lg border border-[color:var(--hub-accent-border,rgba(16,185,129,0.25))] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.1))] px-3 py-1.5 text-xs font-bold text-[color:var(--hub-accent,#10b981)]'
                    : 'rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300'
                }
              >
                {b.label}
              </span>
            ))}
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
            <KxListingFeaturedPlaceholder className="min-h-[220px] lg:min-h-full" iconClassName="h-16 w-16" />
          )}
        </div>
      </div>
    </div>
  );
}
