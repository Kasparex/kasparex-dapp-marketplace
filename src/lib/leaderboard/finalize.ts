import { computeChroniclesLeaderboard } from '@/lib/chronicles/leaderboard/compute';
import { buildTop100Snapshot, canFinalizeSeason } from './snapshot';
import { currentSeasonWindowUtc, previousSeasonId, type SeasonId } from './seasons';
import { getSeasonMeta, setSeasonMeta, setTop100Snapshot } from './snapshotStore';
import type { LeaderboardSeasonMeta } from './seasonStatus';

export async function finalizeSeasonSnapshot(seasonId: SeasonId, nowUtcMs: number = Date.now()): Promise<{
  ok: boolean;
  published: boolean;
  reason?: string;
}> {
  if (!canFinalizeSeason(nowUtcMs, seasonId)) {
    return { ok: true, published: false, reason: 'Season finalize window not reached.' };
  }

  const existing = await getSeasonMeta(seasonId);
  if (existing?.status === 'snapshot_published' || existing?.status === 'rewards_sent' || existing?.status === 'closed') {
    return { ok: true, published: false, reason: 'Snapshot already published.' };
  }

  const rows = await computeChroniclesLeaderboard({ seasonId, limit: 3000 });
  const snapshot = buildTop100Snapshot({
    seasonId,
    updatedAtMs: nowUtcMs,
    scores: rows.map((r) => ({ address: r.wallet, points: r.totalScore })),
  });
  await setTop100Snapshot(snapshot);

  const nextMeta: LeaderboardSeasonMeta = {
    seasonId,
    status: 'snapshot_published',
    snapshotPublishedAtMs: nowUtcMs,
    updatedAtMs: nowUtcMs,
  };
  await setSeasonMeta(nextMeta);
  return { ok: true, published: true };
}

export function seasonToFinalize(nowUtcMs: number = Date.now()): SeasonId {
  const current = currentSeasonWindowUtc(nowUtcMs);
  return previousSeasonId(current.id);
}
