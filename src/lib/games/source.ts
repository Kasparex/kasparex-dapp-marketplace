import type { Game } from './games';

export type GameSourceFilter = 'all' | 'kasparex' | 'community';

export type GamePublisher = 'kasparex' | 'community';

export function getGamePublisher(game: Game): GamePublisher {
  if (game.publisher === 'kasparex' || game.publisher === 'community') {
    return game.publisher;
  }
  if (game.developer.toLowerCase().includes('kasparex')) {
    return 'kasparex';
  }
  return 'community';
}

export function matchesGameSourceFilter(game: Game, filter: GameSourceFilter): boolean {
  if (filter === 'all') return true;
  return getGamePublisher(game) === filter;
}
