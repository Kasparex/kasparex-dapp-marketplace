'use client';

import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { GameType, GameDifficulty, GameStatus, gameTypes, difficultyLevels } from '@/lib/games/games';

interface GameListingFiltersBarProps {
  selectedGameTypes: GameType[];
  onGameTypeChange: (types: GameType[]) => void;
  selectedDifficulties: GameDifficulty[];
  onDifficultyChange: (difficulties: GameDifficulty[]) => void;
  selectedStatuses: GameStatus[];
  onStatusChange: (statuses: GameStatus[]) => void;
}

function multiValue<T extends string>(selected: T[]): T | 'all' {
  if (selected.length === 0 || selected.length > 1) return 'all';
  return selected[0];
}

export function GameListingFiltersBar({
  selectedGameTypes,
  onGameTypeChange,
  selectedDifficulties,
  onDifficultyChange,
  selectedStatuses,
  onStatusChange,
}: GameListingFiltersBarProps) {
  const typeValue = multiValue(selectedGameTypes);
  const difficultyValue = multiValue(selectedDifficulties);
  const statusValue = multiValue(selectedStatuses);

  return (
    <>
      <KxFilterDropdown
        value={typeValue}
        onChange={(v) => onGameTypeChange(v === 'all' ? [] : [v as GameType])}
        options={[
          { value: 'all', label: 'All types' },
          ...(Object.keys(gameTypes) as GameType[]).map((t) => ({
            value: t,
            label: gameTypes[t].name,
          })),
        ]}
        ariaLabel="Filter by game type"
      />
      <KxFilterDropdown
        value={difficultyValue}
        onChange={(v) => onDifficultyChange(v === 'all' ? [] : [v as GameDifficulty])}
        options={[
          { value: 'all', label: 'All difficulties' },
          ...(Object.keys(difficultyLevels) as GameDifficulty[]).map((d) => ({
            value: d,
            label: difficultyLevels[d].name,
          })),
        ]}
        ariaLabel="Filter by difficulty"
      />
      <KxFilterDropdown
        value={statusValue}
        onChange={(v) => onStatusChange(v === 'all' ? [] : [v as GameStatus])}
        options={[
          { value: 'all', label: 'All statuses' },
          { value: 'active', label: 'Active' },
          { value: 'beta', label: 'Beta' },
          { value: 'coming-soon', label: 'Coming soon' },
          { value: 'maintenance', label: 'Maintenance' },
        ]}
        ariaLabel="Filter by status"
      />
    </>
  );
}
