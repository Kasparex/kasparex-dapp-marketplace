'use client';

import Link from 'next/link';
import { Game, gameTypes } from '@/lib/games/games';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholder } from '@/components/kx/KxListingCardPlaceholder';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { GameDifficultyBadge } from './GameDifficultyBadge';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const gameType = gameTypes[game.gameType];
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(game.id);
  const isLiked = hasLiked(game.id);
  const isFavoriteGame = isFavorite(game.id);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <KxListingCard
      href={`/games/${game.slug}`}
      accent="games"
      className="w-full text-left relative flex flex-col min-h-[320px]"
    >
      <KxListingCardMedia aspectClass="aspect-[16/9]">
        {game.featuredImage ? (
          <img src={game.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <KxListingCardPlaceholder />
        )}

        {game.status === 'beta' && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 z-20 shadow-sm">
            Beta
          </span>
        )}

        <div className="absolute top-3 right-3 z-20">
          <GameDifficultyBadge difficulty={game.difficulty} size="sm" />
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex-1 min-h-0">
        {/* Game Title and Type */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
            {game.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-500 font-medium">Type:</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {gameType.emoji} {gameType.name}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {game.description}
          </p>
        </div>

        {/* Bottom Section: Entry Cost, Rewards, and Actions */}
        <div className="mt-auto space-y-3">
          {/* Entry Cost - Prominent Display */}
          <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Entry Cost</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {game.entryCostKAS}
                  </span>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Indicators - Diamond Veins: same card styling as others, clear ratio + L1→L2 */}
          {game.slug === 'diamond-veins' && (
            <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Rewards</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">1 diamond = 1 pt</span>
                <span className="text-zinc-400 dark:text-zinc-500">·</span>
                <span>Up to <strong>1.5×</strong> with time bonus</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Earn points on L1</span>
                <span aria-hidden>→</span>
                <Link href="/rewards-and-points" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  Claim rewards on L2
                </Link>
              </div>
            </div>
          )}
          {game.rewardConfig && game.slug !== 'diamond-veins' && (
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              {game.rewardConfig.gridReward && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{game.rewardConfig.gridReward} GRID</span>
                </div>
              )}
              {game.rewardConfig.xpReward && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">{game.rewardConfig.xpReward} XP</span>
                </div>
              )}
            </div>
          )}

          {/* Game Type Badge and Action Icons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Game Type Badge */}
            <div className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
              <span className="mr-1.5">{gameType.emoji}</span>
              <span>{gameType.name}</span>
            </div>

            {/* Right: Star/Heart Icons */}
            <div className="flex items-center gap-1">
              {/* Star Button (Favorites) */}
              <button
                onClick={(e) => handleIconClick(e, () => {
                  if (isWalletConnectedForFavorites) {
                    toggleFavorite(game.id);
                  }
                })}
                className={`p-1.5 rounded-lg transition-colors ${
                  isFavoriteGame
                    ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : isWalletConnectedForFavorites
                    ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                }`}
                title={isWalletConnectedForFavorites ? (isFavoriteGame ? 'Remove from favorites' : 'Add to favorites') : 'Connect wallet to favorite'}
                aria-label={isWalletConnectedForFavorites ? (isFavoriteGame ? 'Remove from favorites' : 'Add to favorites') : 'Connect wallet to favorite'}
                disabled={!isWalletConnectedForFavorites}
              >
                <svg className="w-4 h-4" fill={isFavoriteGame ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>

              {/* Heart Button (Like) */}
              <button
                onClick={(e) => handleIconClick(e, () => {
                  if (isWalletConnectedForLikes) {
                    toggleLike(game.id);
                  }
                })}
                className={`p-1.5 rounded-lg transition-colors relative ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                    : isWalletConnectedForLikes
                    ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                }`}
                title={isWalletConnectedForLikes ? (isLiked ? 'Unlike' : 'Like') : 'Connect wallet to like'}
                aria-label={isWalletConnectedForLikes ? (isLiked ? 'Unlike' : 'Like') : 'Connect wallet to like'}
                disabled={!isWalletConnectedForLikes}
              >
                <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likeCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {likeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
