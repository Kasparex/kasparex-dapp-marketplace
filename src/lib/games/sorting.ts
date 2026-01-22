import { Game, GameDifficulty } from './games';

export type GameSortOption = 
  | 'newest'
  | 'oldest'
  | 'alphabetical-az'
  | 'alphabetical-za'
  | 'cost-low'
  | 'cost-high'
  | 'difficulty'
  | 'popularity'
  | 'favorites'
  | 'likes-high'
  | 'likes-low';

export interface LikesData {
  [gameId: string]: {
    count: number;
    wallets: string[];
  };
}

const difficultyOrder: Record<GameDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};

export function sortGames(
  games: Game[],
  sortBy: GameSortOption,
  favorites?: Set<string>,
  likes?: LikesData
): Game[] {
  const sorted = [...games];

  switch (sortBy) {
    case 'newest':
      // Sort by createdAt descending (newest first)
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Fallback to ID (numeric comparison)
        const aId = parseInt(a.id.replace('game-', ''), 10);
        const bId = parseInt(b.id.replace('game-', ''), 10);
        return isNaN(bId) || isNaN(aId) ? b.id.localeCompare(a.id) : bId - aId;
      });

    case 'oldest':
      // Sort by createdAt ascending (oldest first)
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Fallback to ID (numeric comparison)
        const aId = parseInt(a.id.replace('game-', ''), 10);
        const bId = parseInt(b.id.replace('game-', ''), 10);
        return isNaN(aId) || isNaN(bId) ? a.id.localeCompare(b.id) : aId - bId;
      });

    case 'alphabetical-az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'alphabetical-za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'cost-low':
      // Sort by entry cost ascending (lowest first)
      return sorted.sort((a, b) => {
        if (a.entryCostKAS !== b.entryCostKAS) {
          return a.entryCostKAS - b.entryCostKAS;
        }
        // If same cost, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'cost-high':
      // Sort by entry cost descending (highest first)
      return sorted.sort((a, b) => {
        if (a.entryCostKAS !== b.entryCostKAS) {
          return b.entryCostKAS - a.entryCostKAS;
        }
        // If same cost, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'difficulty':
      // Sort by difficulty order, then by name
      return sorted.sort((a, b) => {
        const aOrder = difficultyOrder[a.difficulty] || 999;
        const bOrder = difficultyOrder[b.difficulty] || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        // If same difficulty, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'popularity':
      // Sort by play count descending (most played first)
      return sorted.sort((a, b) => {
        const aPlays = a.playCount || 0;
        const bPlays = b.playCount || 0;
        if (aPlays !== bPlays) {
          return bPlays - aPlays; // Descending order
        }
        // If same plays, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'favorites':
      // Sort favorites first, then by name
      if (!favorites || favorites.size === 0) {
        return sorted; // If no favorites, return as-is
      }
      return sorted.sort((a, b) => {
        const aIsFavorite = favorites.has(a.id);
        const bIsFavorite = favorites.has(b.id);
        if (aIsFavorite && !bIsFavorite) {
          return -1;
        }
        if (!aIsFavorite && bIsFavorite) {
          return 1;
        }
        // If both are favorites or both are not, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'likes-high':
      // Sort by like count descending (highest first)
      return sorted.sort((a, b) => {
        const aLikes = likes?.[a.id]?.count || a.likeCount || 0;
        const bLikes = likes?.[b.id]?.count || b.likeCount || 0;
        if (aLikes !== bLikes) {
          return bLikes - aLikes; // Descending order
        }
        // If same likes, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'likes-low':
      // Sort by like count ascending (lowest first)
      return sorted.sort((a, b) => {
        const aLikes = likes?.[a.id]?.count || a.likeCount || 0;
        const bLikes = likes?.[b.id]?.count || b.likeCount || 0;
        if (aLikes !== bLikes) {
          return aLikes - bLikes; // Ascending order
        }
        // If same likes, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    default:
      return sorted;
  }
}
