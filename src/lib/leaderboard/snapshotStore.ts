import type { SeasonId } from './seasons';
import type { GlobalTop100Snapshot } from './top100';
import { leaderboardKvKeyTop100 } from './top100';
import { leaderboardStoreGet, leaderboardStoreSet } from './store';
import type { LeaderboardSeasonMeta } from './seasonStatus';
import { leaderboardKvKeySeasonMeta } from './seasonStatus';

export async function getTop100Snapshot(seasonId: SeasonId): Promise<GlobalTop100Snapshot | null> {
  return leaderboardStoreGet<GlobalTop100Snapshot>(leaderboardKvKeyTop100(seasonId));
}

export async function setTop100Snapshot(snapshot: GlobalTop100Snapshot): Promise<void> {
  await leaderboardStoreSet(leaderboardKvKeyTop100(snapshot.seasonId), snapshot);
}

export async function getSeasonMeta(seasonId: SeasonId): Promise<LeaderboardSeasonMeta | null> {
  return leaderboardStoreGet<LeaderboardSeasonMeta>(leaderboardKvKeySeasonMeta(seasonId));
}

export async function setSeasonMeta(meta: LeaderboardSeasonMeta): Promise<void> {
  await leaderboardStoreSet(leaderboardKvKeySeasonMeta(meta.seasonId), meta);
}
