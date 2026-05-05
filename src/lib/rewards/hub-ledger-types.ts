import type { SeasonId } from '@/lib/leaderboard/seasons';

export type LedgerSeasonBucket = SeasonId | 'legacy';

export type HubLedgerEntryKind = 'earn' | 'redeem_spend';

export type EarnSource =
  | 'chronicles_read'
  | 'chronicles_slot'
  | 'minecore_note'
  | 'rewards_catalog'
  | 'legacy_import';

export type HubLedgerEntry = {
  id: string;
  atMs: number;
  walletL1: string;
  seasonId: LedgerSeasonBucket;
  kind: HubLedgerEntryKind;
  source: EarnSource;
  /** Positive adds redeemable pool; negative subtracts (earns or spends). */
  redeemableDelta: number;
  /** Seasonal contribution toward hub leaderboard rank. */
  leaderboardWeight: number;
  meta?: Record<string, unknown>;
};
