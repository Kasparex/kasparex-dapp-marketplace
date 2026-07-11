import { Game, GameType, GameDifficulty, GameStatus } from './games';
import type { UnifiedGame } from './registry';
import { gameMatchesCurrencies } from '@/lib/hub/listingCurrencies';

export interface GameFilterState {
  gameType: GameType[];
  difficulty: GameDifficulty[];
  status: GameStatus[];
  currencies?: string[];
  costRange?: {
    min: number;
    max: number;
  };
}

export function filterGames(
  games: Game[],
  filters: GameFilterState,
  searchQuery?: string
): Game[] {
  return games.filter((game) => {
    // Game type filter - empty array means all selected
    if (filters.gameType.length > 0 && !filters.gameType.includes(game.gameType)) {
      return false;
    }

    // Difficulty filter - empty array means all selected
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(game.difficulty)) {
      return false;
    }

    // Status filter - empty array means all selected
    if (filters.status.length > 0 && !filters.status.includes(game.status)) {
      return false;
    }

    // Payment currency filter (from game SKUs)
    if (filters.currencies && filters.currencies.length > 0) {
      if (!gameMatchesCurrencies(game as UnifiedGame, filters.currencies)) {
        return false;
      }
    }

    // Cost range filter
    if (filters.costRange) {
      const { min, max } = filters.costRange;
      if (game.entryCostKAS < min || game.entryCostKAS > max) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        game.name,
        game.description,
        game.instructions,
        game.developer,
        game.gameType,
        game.difficulty,
        game.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function getGameTypeCounts(
  games: Game[],
  filters: Omit<GameFilterState, 'gameType'>,
  searchQuery?: string
): Record<GameType, number> {
  const counts: Record<GameType, number> = {
    puzzle: 0,
    arcade: 0,
    strategy: 0,
    casual: 0,
    multiplayer: 0,
    trivia: 0,
    skill: 0,
  };

  const filteredGames = filterGames(games, { ...filters, gameType: [] }, searchQuery);

  filteredGames.forEach((game) => {
    if (counts[game.gameType] !== undefined) {
      counts[game.gameType]++;
    }
  });

  return counts;
}

export function getDifficultyCounts(
  games: Game[],
  filters: Omit<GameFilterState, 'difficulty'>,
  searchQuery?: string
): Record<GameDifficulty, number> {
  const counts: Record<GameDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  };

  const filteredGames = filterGames(games, { ...filters, difficulty: [] }, searchQuery);

  filteredGames.forEach((game) => {
    if (counts[game.difficulty] !== undefined) {
      counts[game.difficulty]++;
    }
  });

  return counts;
}

export function getStatusCounts(
  games: Game[],
  filters: Omit<GameFilterState, 'status'>,
  searchQuery?: string
): Record<GameStatus, number> {
  const counts: Record<GameStatus, number> = {
    beta: 0,
    active: 0,
    'coming-soon': 0,
    maintenance: 0,
  };

  const filteredGames = filterGames(games, { ...filters, status: [] }, searchQuery);

  filteredGames.forEach((game) => {
    if (counts[game.status] !== undefined) {
      counts[game.status]++;
    }
  });

  return counts;
}
