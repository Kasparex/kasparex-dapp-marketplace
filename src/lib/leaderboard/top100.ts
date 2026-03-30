import type { SeasonId } from './seasons';

export type GlobalTop100Item = {
  rank: number;
  address: string;
  points: number;
};

export type GlobalTop100Snapshot = {
  seasonId: SeasonId;
  updatedAtMs: number;
  items: GlobalTop100Item[];
};

export function leaderboardKvKeyTop100(seasonId: SeasonId): string {
  return `kxc:season:${seasonId}:top100`;
}

export function leaderboardKvKeyScore(seasonId: SeasonId, addr: string): string {
  return `kxc:season:${seasonId}:score:${addr}`;
}

export function leaderboardKvKeyTx(seasonId: SeasonId, txHash: string): string {
  return `kxc:season:${seasonId}:tx:${txHash}`;
}

export async function fetchGlobalTop100Snapshot(seasonId: SeasonId): Promise<GlobalTop100Snapshot | null> {
  const res = await fetch(`/api/leaderboard/top100?season=${encodeURIComponent(seasonId)}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const j = (await res.json()) as { ok?: boolean; snapshot?: GlobalTop100Snapshot | null };
  if (!j.ok) return null;
  return j.snapshot ?? null;
}

