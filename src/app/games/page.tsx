'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { GameSortFilters, type GameViewMode } from '@/components/games/GameSortFilters';
import { GameGrid } from '@/components/games/GameGrid';
import { placeholderGames, GameType, GameDifficulty, GameStatus } from '@/lib/games/games';
import { filterGames, getGameTypeCounts, getDifficultyCounts, getStatusCounts, GameFilterState } from '@/lib/games/filtering';
import { sortGames, GameSortOption } from '@/lib/games/sorting';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';

function GamesContent() {
  const [selectedGameTypes, setSelectedGameTypes] = useState<GameType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<GameDifficulty[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<GameStatus[]>([]);
  const [costRange, setCostRange] = useState<{ min: number; max: number } | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<GameSortOption>('newest');
  const [viewMode, setViewMode] = useState<GameViewMode>('compact');
  const [displayedCount, setDisplayedCount] = useState(50);
  const { favoritesSet, toggleFavorite, isFavorite } = useFavorites();
  const { likes } = useLikes();

  // Auto-switch from favorites view if no favorites remain
  useEffect(() => {
    if (sortBy === 'favorites' && favoritesSet.size === 0) {
      setSortBy('newest');
    }
  }, [favoritesSet.size, sortBy]);

  // Get counts based on current filters (excluding the count dimension itself)
  const gameTypeCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'gameType'> = {
      difficulty: selectedDifficulties,
      status: selectedStatuses,
      costRange,
    };
    return getGameTypeCounts(placeholderGames, filters, searchQuery);
  }, [selectedDifficulties, selectedStatuses, costRange, searchQuery]);

  const difficultyCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'difficulty'> = {
      gameType: selectedGameTypes,
      status: selectedStatuses,
      costRange,
    };
    return getDifficultyCounts(placeholderGames, filters, searchQuery);
  }, [selectedGameTypes, selectedStatuses, costRange, searchQuery]);

  const statusCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'status'> = {
      gameType: selectedGameTypes,
      difficulty: selectedDifficulties,
      costRange,
    };
    return getStatusCounts(placeholderGames, filters, searchQuery);
  }, [selectedGameTypes, selectedDifficulties, costRange, searchQuery]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    const filters: GameFilterState = {
      gameType: selectedGameTypes,
      difficulty: selectedDifficulties,
      status: selectedStatuses,
      costRange,
    };
    let filtered = filterGames(placeholderGames, filters, searchQuery);

    // If sorting by favorites, filter to only show favorites
    if (sortBy === 'favorites') {
      filtered = filtered.filter((game) => favoritesSet.has(game.id));
    }

    return sortGames(filtered, sortBy, favoritesSet, likes);
  }, [selectedGameTypes, selectedDifficulties, selectedStatuses, costRange, searchQuery, sortBy, favoritesSet, likes]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(50);
  }, [selectedGameTypes, selectedDifficulties, selectedStatuses, costRange, searchQuery, sortBy]);

  // Get games to display (limited by displayedCount)
  const displayedGames = useMemo(() => {
    return filteredGames.slice(0, displayedCount);
  }, [filteredGames, displayedCount]);

  const hasMore = filteredGames.length > displayedCount;
  const showLoadMore = filteredGames.length >= 50;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 50, filteredGames.length));
  };

  const handleResetFilters = () => {
    setSelectedGameTypes([]);
    setSelectedDifficulties([]);
    setSelectedStatuses([]);
    setCostRange(undefined);
    setSearchQuery('');
  };

  return (
    <>
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <GamesSidebar
            selectedGameTypes={selectedGameTypes}
            onGameTypeChange={setSelectedGameTypes}
            selectedDifficulties={selectedDifficulties}
            onDifficultyChange={setSelectedDifficulties}
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            costRange={costRange}
            onCostRangeChange={setCostRange}
            gameTypeCounts={gameTypeCounts}
            difficultyCounts={difficultyCounts}
            statusCounts={statusCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
          />
        </div>
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <GamesSidebar
            selectedGameTypes={selectedGameTypes}
            onGameTypeChange={setSelectedGameTypes}
            selectedDifficulties={selectedDifficulties}
            onDifficultyChange={setSelectedDifficulties}
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            costRange={costRange}
            onCostRangeChange={setCostRange}
            gameTypeCounts={gameTypeCounts}
            difficultyCounts={difficultyCounts}
            statusCounts={statusCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 relative">
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="lg:pl-0 pl-12 flex-1">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Kasparex Games
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {/* Action Buttons and Sort Filters */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <GameSortFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <GameGrid games={displayedGames} viewMode={viewMode} />

            {showLoadMore && hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function GamesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-zinc-500 dark:text-zinc-400 mb-4">Loading games...</div>
              <div className="animate-pulse text-sm text-zinc-400 dark:text-zinc-500">
                Please wait
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }>
        <GamesContent />
      </Suspense>
    </div>
  );
}
