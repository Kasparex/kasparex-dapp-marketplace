import type { LedgerSeasonBucket } from './ledger-season';

export type { LedgerSeasonBucket } from './ledger-season';

export type HubLedgerEntryKind = 'earn' | 'redeem_spend';

export type EarnSource =
  | 'minecore_note'
  | 'rewards_catalog'
  | 'legacy_import'
  | 'vblog_article_create'
  | 'vblog_article_update'
  | 'vblog_premium_unlock'
  | 'vblog_tip'
  | 'vblog_poll_vote'
  | 'vblog_reading_receipt'
  | 'crowdkas_campaign_create'
  | 'store_product_list'
  | 'dapp_directory_list'
  | 'magazine_issue_publish'
  | 'hub_ad_placement'
  | 'dapp_l1_interaction'
  | 'krex_node_operator'
  | 'chronicles_article_create'
  | 'chronicles_quiz_complete'
  | 'token_listing_create'
  | 'token_listing_update'
  | 'token_listing_verify'
  | 'tokens_listing_vote'
  | 'kpx_covenant_deploy'
  | 'kpx_covenant_claim';

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
