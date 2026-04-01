import type { SeasonId } from './seasons';

export type LeaderboardSeasonStatus = 'live' | 'snapshot_published' | 'rewards_sent' | 'closed';

export type LeaderboardSeasonMeta = {
  seasonId: SeasonId;
  status: LeaderboardSeasonStatus;
  snapshotPublishedAtMs?: number;
  rewardsSentAtMs?: number;
  rewardsConfirmedAtMs?: number;
  rewardsTxRef?: string;
  note?: string;
  updatedAtMs: number;
};

export function leaderboardKvKeySeasonMeta(seasonId: SeasonId): string {
  return `kxc:season:${seasonId}:meta`;
}
