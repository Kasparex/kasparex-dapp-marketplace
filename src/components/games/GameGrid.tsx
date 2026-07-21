'use client';

import { useState, useEffect } from 'react';
import { Game, type GameType } from '@/lib/games/games';
import { GameCard } from './GameCard';

interface GameGridProps {
  games: Game[];
  viewMode?: 'grid' | 'compact' | 'list';
  onCategoryFilter?: (gameType: GameType) => void;
}

export function GameGrid({ games, viewMode = 'grid', onCategoryFilter }: GameGridProps) {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Check sidebar state from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedHidden = localStorage.getItem('games-sidebar-hidden');
      setIsSidebarHidden(savedHidden === 'true');
    };
    
    checkSidebarState();
    // Listen for storage changes (when sidebar is toggled)
    window.addEventListener('storage', checkSidebarState);
    // Also check periodically in case localStorage is updated in same window
    const interval = setInterval(checkSidebarState, 100);
    
    return () => {
      window.removeEventListener('storage', checkSidebarState);
      clearInterval(interval);
    };
  }, []);

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No games found matching your filters.
        </p>
      </div>
    );
  }

  // Grid column classes based on view mode and sidebar visibility
  let gridCols: string;
  if (viewMode === 'compact') {
    gridCols = isSidebarHidden 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
  } else if (viewMode === 'list') {
    gridCols = 'grid-cols-1';
  } else {
    // Default grid view
    gridCols = isSidebarHidden 
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
  }

  // Card size classes based on view mode
  const cardClasses = {
    grid: '',
    compact: 'min-h-[240px]',
    list: 'min-h-[120px] flex-row',
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="transform transition-all">
            <GameCard game={game} onCategoryFilter={onCategoryFilter} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4 items-stretch`}>
      {games.map((game) => (
        <div key={game.id} className="h-full min-h-0 transform transition-all">
          <GameCard game={game} onCategoryFilter={onCategoryFilter} />
        </div>
      ))}
    </div>
  );
}
