'use client';

import { Game, gameTypes, type GameType } from '@/lib/games/games';
import { useFavorites } from '@/hooks/useFavorites';
import { gameL1PlayGateConfig } from '@/lib/hub/gateConfigs';
import { HubGatedListingCard } from '@/components/hub/HubGatedListingCard';
import { KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { GameDifficultyBadge } from './GameDifficultyBadge';
import { GameTypeIcon } from './GameTypeIcon';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { GameVoteControls } from './GameVoteControls';
import { GameNetworkBadge } from './GameNetworkBadge';
import type { GameCapability } from '@/lib/games/registry';
import { resolveGameAuthorWallet } from '@/lib/games/author';
import { formatAddress } from '@/lib/vblog/utils';

interface GameCardProps {
  game: Game & { capabilities?: GameCapability[] };
  onCategoryFilter?: (gameType: GameType) => void;
}

export function GameCard({ game, onCategoryFilter }: GameCardProps) {
  const gameType = gameTypes[game.gameType];
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const isFavoriteGame = isFavorite(game.id);
  const authorAddress = resolveGameAuthorWallet(game);
  const authorLabel = formatAddress(authorAddress);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCategoryFilter?.(game.gameType);
  };

  return (
    <HubGatedListingCard
      href={`/games/${game.slug}`}
      accent="games"
      config={gameL1PlayGateConfig(game)}
      className="relative flex h-full min-h-[320px] flex-col"
    >
      <KxListingCardMedia className="border-b border-zinc-200/50 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:border-zinc-800/50 dark:from-zinc-800 dark:to-zinc-900">
        {game.featuredImage ? (
          <img src={game.featuredImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
          {game.status === 'beta' ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 shadow-sm backdrop-blur-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Beta
            </span>
          ) : null}
          <GameDifficultyBadge difficulty={game.difficulty} size="sm" />
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 line-clamp-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {game.name}
            </h3>
            <GameNetworkBadge
              capabilities={game.capabilities}
              size="sm"
              compact
              className="shrink-0"
            />
          </div>
          <AuthorInline
            address={authorAddress}
            displayName={authorLabel}
            prefix=""
            className="text-sm"
          />
        </div>

        <div className="mb-3 min-h-[4.5rem] flex-1">
          <p className="kx-body-sm line-clamp-3">{game.description}</p>
        </div>

        <div className="mt-auto shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/50 pt-3 dark:border-zinc-800/50">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[color:var(--hub-accent-border)] hover:bg-[color:var(--hub-accent-muted)] hover:text-[color:var(--hub-accent)] dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300"
              title={`Filter by ${gameType.name}`}
            >
              <span className="mr-1.5 inline-flex align-middle text-zinc-500 dark:text-zinc-400">
                <GameTypeIcon type={game.gameType} className="h-4 w-4" />
              </span>
              <span className="align-middle">{gameType.name}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) =>
                  handleIconClick(e, () => {
                    if (isWalletConnectedForFavorites) toggleFavorite(game.id);
                  })
                }
                className={`rounded-lg p-1.5 transition-colors ${
                  isFavoriteGame
                    ? 'bg-yellow-50 text-yellow-500 hover:text-yellow-600 dark:bg-yellow-900/20'
                    : isWalletConnectedForFavorites
                      ? 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
                      : 'cursor-not-allowed text-zinc-300 dark:text-zinc-600'
                }`}
                title={
                  isWalletConnectedForFavorites
                    ? isFavoriteGame
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                    : 'Connect wallet to favorite'
                }
                aria-label={
                  isWalletConnectedForFavorites
                    ? isFavoriteGame
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                    : 'Connect wallet to favorite'
                }
                disabled={!isWalletConnectedForFavorites}
              >
                <svg
                  className="h-4 w-4"
                  fill={isFavoriteGame ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>

              <GameVoteControls game={game} />
            </div>
          </div>
        </div>
      </KxListingCardBody>
    </HubGatedListingCard>
  );
}
