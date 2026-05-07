-- Pts hub: authoritative redeemable points ledger (REWARDS_DB / kasparex-rewards)
-- Run: wrangler d1 execute kasparex-rewards --file=./workers/migrations/002_pts_hub.sql

CREATE TABLE IF NOT EXISTS pts_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE,
  wallet_norm TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('credit', 'debit')),
  delta_pts INTEGER NOT NULL,
  source TEXT NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pts_events_wallet ON pts_events(wallet_norm);
CREATE INDEX IF NOT EXISTS idx_pts_events_created ON pts_events(created_at);

CREATE TABLE IF NOT EXISTS pts_balances (
  wallet_norm TEXT PRIMARY KEY,
  balance_pts INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS redemption_jobs (
  id TEXT PRIMARY KEY,
  wallet_kaspa_norm TEXT NOT NULL,
  evm_beneficiary TEXT NOT NULL,
  token_address TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  pts_spent INTEGER NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('voucher_issued', 'claimed', 'failed')),
  voucher_deadline INTEGER NOT NULL,
  chain_id INTEGER NOT NULL,
  vault_address TEXT NOT NULL,
  voucher_signature TEXT,
  voucher_nonce TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redemption_jobs_wallet ON redemption_jobs(wallet_kaspa_norm);
CREATE INDEX IF NOT EXISTS idx_redemption_jobs_status ON redemption_jobs(status);

CREATE TABLE IF NOT EXISTS pts_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  root_hash TEXT NOT NULL,
  rows_hash TEXT,
  event_count INTEGER NOT NULL,
  balance_row_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pts_events_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL,
  wallet_norm TEXT NOT NULL,
  kind TEXT NOT NULL,
  delta_pts INTEGER NOT NULL,
  source TEXT NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pts_events_archive_wallet ON pts_events_archive(wallet_norm);
CREATE INDEX IF NOT EXISTS idx_pts_events_archive_archived ON pts_events_archive(archived_at);
