'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Game, gameTypes } from '@/lib/games/games';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { GameDifficultyBadge } from './GameDifficultyBadge';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { GameTypeIcon } from './GameTypeIcon';

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
    <KxListingCard href={`/games/${game.slug}`} accent="games" className="relative flex flex-col min-h-[320px]">
      {/* Game Banner */}
      <KxListingCardMedia className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50">
        {game.featuredImage ? (
          <img src={game.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
        
        {/* Beta Status Badge - Top Left */}
        {game.status === 'beta' && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 z-20 shadow-sm">
            Beta
          </span>
        )}

        {/* Difficulty Badge - Top Right */}
        <div className="absolute top-3 right-3 z-20">
          <GameDifficultyBadge difficulty={game.difficulty} size="sm" />
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Game Title and Type */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
            {game.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium">
              <span className="text-zinc-500 dark:text-zinc-500 inline-flex items-center gap-1.5">
                <GameTypeIcon type={game.gameType} className="h-4 w-4" />
                <span>{gameType.name}</span>
              </span>
              {(game.rewardConfig?.gridReward || game.rewardConfig?.xpReward) && (
                <span className="text-zinc-400 dark:text-zinc-600">·</span>
              )}
              {game.rewardConfig?.gridReward ? (
                <span className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{game.rewardConfig.gridReward}</span> GRID
                </span>
              ) : null}
              {game.rewardConfig?.gridReward && game.rewardConfig?.xpReward ? (
                <span className="text-zinc-400 dark:text-zinc-600">·</span>
              ) : null}
              {game.rewardConfig?.xpReward ? (
                <span className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{game.rewardConfig.xpReward}</span> XP
                </span>
              ) : null}
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

          {/* Game Type Badge and Action Icons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Game Type Badge */}
            <div className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
              <span className="mr-1.5 inline-flex align-middle text-zinc-500 dark:text-zinc-400">
                <GameTypeIcon type={game.gameType} className="h-4 w-4" />
              </span>
              <span className="align-middle">{gameType.name}</span>
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
