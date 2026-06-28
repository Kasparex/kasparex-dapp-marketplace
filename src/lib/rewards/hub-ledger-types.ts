import type { LedgerSeasonBucket } from './ledger-season';

export type { LedgerSeasonBucket } from './ledger-season';

export type HubLedgerEntryKind = 'earn' | 'redeem_spend';

export type EarnSource =
  | 'minecore_note'
  | 'rewards_catalog'
  | 'legacy_import'
  | 'vblog_article_create'
  | 'vblog_article_update'
  | 'crowdkas_campaign_create'
  | 'store_product_list'
  | 'dapp_directory_list'
  | 'magazine_issue_publish'
  | 'hub_ad_placement'
  | 'dapp_l1_interaction'
  | 'krex_node_operator';

export type HubLedgerEntry = {
  id: string;
  atMs: number;
  walletL1: string;
  seasonId: LedgerSeasonBucket;
  kind: HubLedgerEntryKind;
  source: EarnSource;
  /** Positive adds redeemable pool; negative subtracts (earns or spends). */
  redeemableDelta: number;
  /** Legacy field; always 0 for new entries. Kept for existing localStorage blobs. */
  leaderboardWeight: number;
  meta?: Record<string, unknown>;
};
