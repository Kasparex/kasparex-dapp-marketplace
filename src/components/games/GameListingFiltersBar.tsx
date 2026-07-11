'use client';

import { useMemo } from 'react';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { gameTypes, difficultyLevels, type GameType, type GameDifficulty, type GameStatus } from '@/lib/games/games';
import { HubCryptocurrencyMultiFilter } from '@/components/hub/HubMultiSelectFilters';

export function GameListingFiltersBar({
  selectedGameTypes,
  onGameTypeChange,
  selectedCurrencies,
  onCurrencyChange,
  currencyOptions,
  selectedStatuses,
  onStatusChange,
}: {
  selectedGameTypes: GameType[];
  onGameTypeChange: (types: GameType[]) => void;
  selectedCurrencies: string[];
  onCurrencyChange: (currencies: string[]) => void;
  currencyOptions: string[];
  selectedStatuses: GameStatus[];
  onStatusChange: (statuses: GameStatus[]) => void;
}) {
  const typeOptions = useMemo(
    () => (Object.keys(gameTypes) as GameType[]).map((t) => ({ value: t, label: gameTypes[t].name })),
    [],
  );

  const statusOptions = useMemo(
    () =>
      [
        { value: 'active' as const, label: 'Active' },
        { value: 'beta' as const, label: 'Beta' },
        { value: 'coming-soon' as const, label: 'Coming soon' },
        { value: 'maintenance' as const, label: 'Maintenance' },
      ] satisfies { value: GameStatus; label: string }[],
    [],
  );

  return (
    <>
      <KxMultiSelectDropdown
        values={selectedGameTypes}
        onChange={(next) => onGameTypeChange(next as GameType[])}
        options={typeOptions}
        ariaLabel="Filter by game type"
        placeholder="Game type"
        filterPlaceholder="Filter types…"
        showFilter
        triggerClassName="k-control-btn min-w-[140px] h-10"
        menuClassName="w-64"
      />
      <HubCryptocurrencyMultiFilter
        values={selectedCurrencies}
        onChange={onCurrencyChange}
        options={currencyOptions}
        placeholder="Cryptocurrency"
        filterPlaceholder="Filter currencies…"
      />
      <KxMultiSelectDropdown
        values={selectedStatuses}
        onChange={(next) => onStatusChange(next as GameStatus[])}
        options={statusOptions}
        ariaLabel="Filter by status"
        placeholder="Status"
        filterPlaceholder="Filter statuses…"
        showFilter
        triggerClassName="k-control-btn min-w-[140px] h-10"
        menuClassName="w-64"
      />
    </>
  );
}

/** @deprecated Difficulty filter removed from the filter bar; kept for sidebar use. */
export type { GameDifficulty };
export { difficultyLevels };
