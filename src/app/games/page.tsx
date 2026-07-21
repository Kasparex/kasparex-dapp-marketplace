'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { GameSortFilters, type GameViewMode } from '@/components/games/GameSortFilters';
import { GameGrid } from '@/components/games/GameGrid';
import { GamesHeader } from '@/components/games/GamesHeader';
import { GameType, GameDifficulty, GameStatus } from '@/lib/games/games';
import { filterGames, getGameTypeCounts, getDifficultyCounts, getStatusCounts, GameFilterState } from '@/lib/games/filtering';
import { sortGames, GameSortOption } from '@/lib/games/sorting';
import { matchesGameSourceFilter, type GameSourceFilter } from '@/lib/games/source';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { FilterBar } from '@/components/FilterBar';
import { listGames } from '@/lib/games/registry';
import { getGameListingCurrencies } from '@/lib/hub/listingCurrencies';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { GameListingFiltersBar } from '@/components/games/GameListingFiltersBar';
import { GamesHaloHeader } from '@/components/games/GamesHaloHeader';

function GamesContent() {
  const [sourceFilter, setSourceFilter] = useState<GameSourceFilter>('all');
  const [selectedGameTypes, setSelectedGameTypes] = useState<GameType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<GameDifficulty[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<GameStatus[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [costRange, setCostRange] = useState<{ min: number; max: number } | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<GameSortOption>('newest');
  const [viewMode, setViewMode] = useState<GameViewMode>('compact');
  const [displayedCount, setDisplayedCount] = useState(50);
  const { favoritesSet } = useFavorites();
  const { likes } = useLikes();
  const allGames = useMemo(() => listGames(), []);
  const currencyOptions = useMemo(() => getGameListingCurrencies(allGames), [allGames]);

  const games = useMemo(
    () => allGames.filter((game) => matchesGameSourceFilter(game, sourceFilter)),
    [allGames, sourceFilter],
  );

  useEffect(() => {
    if (sortBy === 'favorites' && favoritesSet.size === 0) {
      setSortBy('newest');
    }
  }, [favoritesSet.size, sortBy]);

  const gameTypeCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'gameType'> = {
      difficulty: selectedDifficulties,
      status: selectedStatuses,
      costRange,
    };
    return getGameTypeCounts(games, filters, searchQuery);
  }, [games, selectedDifficulties, selectedStatuses, costRange, searchQuery]);

  const difficultyCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'difficulty'> = {
      gameType: selectedGameTypes,
      status: selectedStatuses,
      costRange,
    };
    return getDifficultyCounts(games, filters, searchQuery);
  }, [games, selectedGameTypes, selectedStatuses, costRange, searchQuery]);

  const statusCounts = useMemo(() => {
    const filters: Omit<GameFilterState, 'status'> = {
      gameType: selectedGameTypes,
      difficulty: selectedDifficulties,
      costRange,
    };
    return getStatusCounts(games, filters, searchQuery);
  }, [games, selectedGameTypes, selectedDifficulties, costRange, searchQuery]);

  const filteredGames = useMemo(() => {
    const filters: GameFilterState = {
      gameType: selectedGameTypes,
      difficulty: selectedDifficulties,
      status: selectedStatuses,
      currencies: selectedCurrencies,
      costRange,
    };
    let filtered = filterGames(games, filters, searchQuery);

    if (sortBy === 'favorites') {
      filtered = filtered.filter((game) => favoritesSet.has(game.id));
    }

    return sortGames(filtered, sortBy, favoritesSet, likes);
  }, [games, selectedGameTypes, selectedDifficulties, selectedStatuses, selectedCurrencies, costRange, searchQuery, sortBy, favoritesSet, likes]);

  useEffect(() => {
    setDisplayedCount(50);
  }, [selectedGameTypes, selectedDifficulties, selectedStatuses, selectedCurrencies, costRange, searchQuery, sortBy, sourceFilter]);

  const displayedGames = useMemo(() => filteredGames.slice(0, displayedCount), [filteredGames, displayedCount]);

  const hasMore = filteredGames.length > displayedCount;
  const showLoadMore = filteredGames.length >= 50;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 50, filteredGames.length));
  };

  const handleResetFilters = () => {
    setSelectedGameTypes([]);
    setSelectedDifficulties([]);
    setSelectedStatuses([]);
    setSelectedCurrencies([]);
    setCostRange(undefined);
    setSearchQuery('');
    setSourceFilter('all');
  };

  const handleCategoryFilter = (gameType: GameType) => {
    setSelectedGameTypes([gameType]);
    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Header />

      <main className="flex flex-1 flex-col lg:flex-row">
        <HubPageAccentLayout projectId="kasparex-games">
        <div className="hidden flex-shrink-0 lg:block">
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

        <div className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>
            <GamesHaloHeader />
            <GamesHeader sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} />

            <div id="content" className="scroll-mt-4" />

            <HubListingTitleRow
              projectId="kasparex-games"
              title="Available games"
              count={filteredGames.length}
              countLabel="game"
              benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
            />

            <div className="mb-6 flex flex-col gap-4">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search games...' }}
                onReset={handleResetFilters}
                flexWrap
              >
                <GameListingFiltersBar
                  selectedGameTypes={selectedGameTypes}
                  onGameTypeChange={setSelectedGameTypes}
                  selectedCurrencies={selectedCurrencies}
                  onCurrencyChange={setSelectedCurrencies}
                  currencyOptions={currencyOptions}
                  selectedStatuses={selectedStatuses}
                  onStatusChange={setSelectedStatuses}
                />
                <GameSortFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </FilterBar>
            </div>

            <GameGrid games={displayedGames} viewMode={viewMode} onCategoryFilter={handleCategoryFilter} />

            {showLoadMore && hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
        </HubPageAccentLayout>
      </main>

      <Footer />
    </>
  );
}

export default function GamesPage() {
  return (
    <div className={`flex min-h-screen flex-col ${HUB_PAGE_BG}`}>
      <Suspense fallback={
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-4 text-zinc-500 dark:text-zinc-400">Loading games...</div>
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
