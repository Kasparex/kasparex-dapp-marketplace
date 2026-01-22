'use client';

import { Game, getGamesByType, placeholderGames } from '@/lib/games/games';
import { GameCard } from './GameCard';

interface RelatedGamesProps {
  currentGame: Game;
}

export function RelatedGames({ currentGame }: RelatedGamesProps) {
  // Get games of the same type, excluding the current game
  const relatedGames = getGamesByType(
    placeholderGames,
    currentGame.gameType
  ).filter((game) => game.id !== currentGame.id).slice(0, 3);

  if (relatedGames.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Related Games
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
