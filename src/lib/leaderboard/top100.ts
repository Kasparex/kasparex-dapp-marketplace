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
  const { nodeFirstGet } = await import('@/lib/nodes/node-first');
  const r = await nodeFirstGet<{ ok?: boolean; snapshot?: GlobalTop100Snapshot | null }>(
    `/kasparex/leaderboard/top100?season=${encodeURIComponent(seasonId)}`,
    {
      roles: ['mirror', 'light'],
      maxNodeAttempts: 3,
      timeoutMs: 3200,
    }
  );
  const j = r.data;
  if (!j.ok) return null;
  return j.snapshot ?? null;
}

