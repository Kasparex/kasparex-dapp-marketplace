import {
  CHRONICLES_LB_POINTS_PER_FILLED_SLOT,
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  type ChroniclesLbEntityType,
} from '@/lib/chronicles/leaderboard/constants';
import type { SeasonId } from './seasons';

type SlotIndex = 1 | 2 | 3;
type SlotKey = `${ChroniclesLbEntityType}:${string}:${SlotIndex}`;

function slotIsActive(activated: Record<string, true>, k: SlotKey): boolean {
  const slotIndex = Number(k.split(':').slice(-1)[0]);
  if (slotIndex === 1) return true;
  return activated[k] === true;
}

export type ChroniclesSeasonScore = {
  seasonId: SeasonId;
  totalPoints: number;
  filledSlotsCount: number;
  confirmedReadsCount: number;
  pendingTxCount: number;
  verifiedTxCount: number;
};

export function scoreChroniclesSeason(input: {
  seasonId: SeasonId;
  activated: Record<string, true>;
  placements: Record<string, string | null>;
  reads: Record<string, true>;
  pendingTxs?: Record<string, unknown>;
  verifiedTxs?: Record<string, unknown>;
}): ChroniclesSeasonScore {
  let filled = 0;
  for (const [k, v] of Object.entries(input.placements) as Array<[SlotKey, string | null]>) {
    if (!slotIsActive(input.activated, k)) continue;
    if (v != null && String(v).trim().length > 0) filled += 1;
  }
  const reads = Object.keys(input.reads).length;
  const totalPoints = filled * CHRONICLES_LB_POINTS_PER_FILLED_SLOT + reads * CHRONICLES_LB_POINTS_PER_READ_CONFIRM;

  return {
    seasonId: input.seasonId,
    totalPoints,
    filledSlotsCount: filled,
    confirmedReadsCount: reads,
    pendingTxCount: Object.keys(input.pendingTxs ?? {}).length,
    verifiedTxCount: Object.keys(input.verifiedTxs ?? {}).length,
  };
}

