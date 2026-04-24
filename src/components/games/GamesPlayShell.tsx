'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { placeholderGames, GameType, GameDifficulty, GameStatus } from '@/lib/games/games';
import { getGameTypeCounts, getDifficultyCounts, getStatusCounts, GameFilterState } from '@/lib/games/filtering';

/**
 * Shared Kasparex Games layout: catalog sidebar + main play area.
 * Used by slug-routed game pages and embedded titles like Minecore.
 */
export function GamesPlayShell(props: { children: React.ReactNode }) {
  const router = useRouter();

  const [selectedGameTypes, setSelectedGameTypes] = useState<GameType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<GameDifficulty[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<GameStatus[]>([]);
  const [costRange, setCostRange] = useState<{ min: number; max: number } | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleFilterChange = () => {
    router.push('/games');
  };

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <div className="hidden flex-shrink-0 lg:block">
        <GamesSidebar
          selectedGameTypes={selectedGameTypes}
          onGameTypeChange={(types) => {
            setSelectedGameTypes(types);
            handleFilterChange();
          }}
          selectedDifficulties={selectedDifficulties}
          onDifficultyChange={(diffs) => {
            setSelectedDifficulties(diffs);
            handleFilterChange();
          }}
          selectedStatuses={selectedStatuses}
          onStatusChange={(stats) => {
            setSelectedStatuses(stats);
            handleFilterChange();
          }}
          costRange={costRange}
          onCostRangeChange={(range) => {
            setCostRange(range);
            handleFilterChange();
          }}
          gameTypeCounts={gameTypeCounts}
          difficultyCounts={difficultyCounts}
          statusCounts={statusCounts}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            handleFilterChange();
          }}
          onResetFilters={() => {
            router.push('/games');
          }}
          backLink={{ href: '/games', label: 'Back to Games' }}
        />
      </div>

      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">{props.children}</div>
    </main>
  );
}
