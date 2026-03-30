import { CHRONICLES_LB_POINTS_PER_READ_CONFIRM, type ChroniclesLbEntityType } from '@/lib/chronicles/leaderboard/constants';
import type { SeasonId } from './seasons';
import { pointsForNftInSlot, type NftRarity } from './nftPoints';

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
  placementRarities?: Record<string, NftRarity>;
  reads: Record<string, true>;
  pendingTxs?: Record<string, unknown>;
  verifiedTxs?: Record<string, unknown>;
}): ChroniclesSeasonScore {
  let filled = 0;
  let slotPoints = 0;
  for (const [k, v] of Object.entries(input.placements) as Array<[SlotKey, string | null]>) {
    if (!slotIsActive(input.activated, k)) continue;
    if (v != null && String(v).trim().length > 0) {
      filled += 1;
      const [collectionRaw, tokenIdRaw] = String(v).split('#');
      const collection = String(collectionRaw ?? '').trim();
      const tokenId = tokenIdRaw != null ? Number(tokenIdRaw) : undefined;
      // Use the same scoring path as the global leaderboard (token-id allowlists for Premium tiers).
      slotPoints += pointsForNftInSlot({ collection, tokenId }).points;
    }
  }
  const reads = Object.keys(input.reads).length;
  const totalPoints = slotPoints + reads * CHRONICLES_LB_POINTS_PER_READ_CONFIRM;

  return {
    seasonId: input.seasonId,
    totalPoints,
    filledSlotsCount: filled,
    confirmedReadsCount: reads,
    pendingTxCount: Object.keys(input.pendingTxs ?? {}).length,
    verifiedTxCount: Object.keys(input.verifiedTxs ?? {}).length,
  };
}

