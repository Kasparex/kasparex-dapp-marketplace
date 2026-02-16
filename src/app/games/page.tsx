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
import { FilterBar } from '@/components/FilterBar';

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
          <div className="max-w-7xl mx-auto">
            {/* Hero - same structure as dApps/Magazines */}
            <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-emerald-950/30 to-zinc-950 border border-zinc-800/50">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.15),transparent_70%)] rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.1),transparent_70%)] rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Games
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                  Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Games</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed mb-8">
                  Play and discover games on Kaspa. Connect a wallet to start.
                </p>
                <a href="#content" className="k-cta-primary">
                  Browse games
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </a>
              </div>
            </div>
            <div id="content" className="scroll-mt-4" />

            {/* Page Header - above Sorting area (dApps pattern) */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Available games
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Controls Area - single row via FilterBar */}
            <div className="flex flex-col gap-4 mb-6">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search games...' }}
                onReset={handleResetFilters}
              >
                <GameSortFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </FilterBar>
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
