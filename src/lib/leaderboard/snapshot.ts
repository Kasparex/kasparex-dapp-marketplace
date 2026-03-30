import type { SeasonId, SeasonWindow } from './seasons';
import { seasonWindowFromSeasonId } from './seasons';
import type { GlobalTop100Snapshot } from './top100';

export type AddressScore = { address: string; points: number };

export function buildTop100Snapshot(input: {
  seasonId: SeasonId;
  updatedAtMs?: number;
  scores: AddressScore[];
}): GlobalTop100Snapshot {
  const sorted = input.scores
    .slice()
    .filter((x) => Number.isFinite(x.points) && x.points > 0 && x.address.trim().length > 0)
    .sort((a, b) => b.points - a.points || a.address.localeCompare(b.address))
    .slice(0, 100);

  return {
    seasonId: input.seasonId,
    updatedAtMs: input.updatedAtMs ?? Date.now(),
    items: sorted.map((x, i) => ({ rank: i + 1, address: x.address, points: x.points })),
  };
}

export function seasonFinalizePolicy(seasonId: SeasonId, options?: { finalizeAfterMs?: number }): SeasonWindow {
  return seasonWindowFromSeasonId(seasonId, { finalizeAfterMs: options?.finalizeAfterMs });
}

export function canFinalizeSeason(nowUtcMs: number, seasonId: SeasonId, options?: { finalizeAfterMs?: number }): boolean {
  const w = seasonFinalizePolicy(seasonId, options);
  return nowUtcMs >= w.finalizeAtUtcMs;
}

