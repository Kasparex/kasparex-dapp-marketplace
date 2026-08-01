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
import { GameNetworkBadge } from '@/components/games/GameNetworkBadge';
import { GameVoteControls } from '@/components/games/GameVoteControls';
import type { GameCapability } from '@/lib/games/registry';
import { resolveGameAuthorWallet } from '@/lib/games/author';
import { formatAddress } from '@/lib/vblog/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { KxBadge, type KxBadgeVariant } from '@/components/ui/KxBadge';

type GamesHaloHeaderProps = {
  game: Pick<
    Game,
    | 'id'
    | 'name'
    | 'slug'
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
    /** Optional intro used in the featured-image hover tooltip. */
    description?: string;
    categories?: string[];
    tags?: string[];
    capabilities?: GameCapability[];
  };
  /** Live Game Deck resources shown in the left column. */
  resources?: GameDeckResource[];
  /** Optional footer under deck rows (e.g. live update hint). */
  deckFooter?: ReactNode;
  /** Milestone player level badge in the header chip row. */
  playerLevel?: number;
};

function formatStatus(status: Game['status']): string {
  if (status === 'coming-soon') return 'Coming soon';
  if (status === 'maintenance') return 'Maintenance';
  if (status === 'beta') return 'Beta';
  return 'Active';
}

function statusBadgeVariant(status: Game['status']): KxBadgeVariant {
  if (status === 'beta') return 'violet';
  if (status === 'coming-soon') return 'amber';
  if (status === 'maintenance') return 'orange';
  return 'emerald';
}

/**
 * Two-column game header (above tabs).
 * Left: kicker + tilt title, author, badges + vote (Tokens-style), Game Deck. Right: featured cover.
 */
export function GamesHaloHeader({ game, resources = [], deckFooter, playerLevel }: GamesHaloHeaderProps) {
  const typeName = gameTypes[game.gameType]?.name ?? game.gameType;
  const difficultyName = difficultyLevels[game.difficulty]?.name ?? game.difficulty;
  const cover = game.featuredImage || game.image;
  const authorWallet = resolveGameAuthorWallet(game);
  const authorLabel = formatAddress(authorWallet);
  const canVote = Boolean(game.id?.trim());

  /** Max 3–4 game-related chips. No entry-cost badge. */
  const badges: { key: string; label: string; variant: KxBadgeVariant }[] = [
    { key: 'status', label: formatStatus(game.status), variant: statusBadgeVariant(game.status) },
    { key: 'type', label: typeName, variant: 'zinc' },
    { key: 'difficulty', label: difficultyName, variant: 'zinc' },
  ];
  if (typeof playerLevel === 'number' && playerLevel > 0) {
    badges.splice(1, 0, { key: 'player-level', label: `Player Lv ${playerLevel}`, variant: 'sky' });
  }
  const extra = [...(game.categories ?? []), ...(game.tags ?? []).map((t) => `#${t}`)].filter(Boolean);
  for (const label of extra) {
    if (badges.length >= 5) break;
    badges.push({ key: `extra-${label}`, label, variant: 'zinc' });
  }

  return (
    <div
      id="game-header"
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 select-text dark:border-zinc-800 dark:bg-zinc-900/45"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--hub-accent-muted,rgba(16,185,129,0.1))] via-transparent to-transparent" />

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div className="absolute right-6 top-6 z-10 sm:right-8 sm:top-8 lg:right-10 lg:top-10">
            <GameNetworkBadge capabilities={game.capabilities} size="sm" />
          </div>

          <p className="mb-3 pr-28 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--hub-accent,#10b981)]">
            Kasparex Games · {typeName}
          </p>

          <div className="mb-3 flex items-center gap-3">
            <span className="hub-tilt-bar h-7 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
            <h1 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {game.name}
            </h1>
          </div>

          <AuthorInline
            address={authorWallet}
            displayName={authorLabel}
            href={`/u/${encodeURIComponent(authorWallet)}`}
            className="mb-4"
          />

          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {badges.map((b) => (
                <KxBadge key={b.key} variant={b.variant}>
                  {b.label}
                </KxBadge>
              ))}
            </div>
            {canVote ? (
              <div className="shrink-0">
                <GameVoteControls
                  game={{ id: game.id, name: game.name, slug: game.slug || game.id }}
                  compact
                />
              </div>
            ) : null}
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
              <GameDeckResourceRows resources={resources} layout="stack" />
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[220px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          <Tooltip
            content={
              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-50">{game.name}</p>
                {game.description?.trim() ? (
                  <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-300">{game.description.trim()}</p>
                ) : (
                  <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">No intro description yet.</p>
                )}
              </div>
            }
            className="max-w-xs"
          >
            <div className="absolute inset-0 cursor-help">
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
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
