'use client';

import { useMemo } from 'react';
import {
  playerLevelFromMilestones,
  resolveMilestoneRows,
  type GameMilestoneProgressInput,
  type GameMilestoneRow,
} from '@/lib/games/milestones/definitions';

export function useGameMilestones(gameId: string, progress: GameMilestoneProgressInput) {
  return useMemo(() => {
    const rows = resolveMilestoneRows(gameId, progress);
    const level = playerLevelFromMilestones(rows);
    const completedCount = rows.filter((r) => r.completed).length;
    return { rows, level, completedCount, total: rows.length };
  }, [gameId, progress]);
}

export type { GameMilestoneRow, GameMilestoneProgressInput };
