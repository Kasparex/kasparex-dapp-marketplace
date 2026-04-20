-- Kasparex Rewards D1 Database Schema
-- For L1 reward distribution and tracking
-- Run with: wrangler d1 execute kasparex-rewards --file=./workers/schema-rewards.sql

-- Active rewards (last 7 days only - reduces storage by 90%+)
CREATE TABLE IF NOT EXISTS rewards_active (
  id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  user_address TEXT NOT NULL,
  dapp_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_value REAL NOT NULL,
  grid_reward REAL,
  dapp_token_reward REAL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  network TEXT NOT NULL DEFAULT 'L1', -- 'L1', 'L2', 'vProgs'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  distributed_at INTEGER,
  ipfs_cid TEXT -- Set when archived to IPFS
);

CREATE INDEX IF NOT EXISTS idx_rewards_active_user ON rewards_active(user_address);
CREATE INDEX IF NOT EXISTS idx_rewards_active_status ON rewards_active(status);
CREATE INDEX IF NOT EXISTS idx_rewards_active_created ON rewards_active(created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_active_tx_hash ON rewards_active(tx_hash);

-- Archived rewards (CID references only, full data on IPFS)
CREATE TABLE IF NOT EXISTS rewards_archived (
  id TEXT PRIMARY KEY,
  ipfs_cid TEXT NOT NULL UNIQUE,
  user_address TEXT NOT NULL,
  dapp_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rewards_archived_user ON rewards_archived(user_address);
CREATE INDEX IF NOT EXISTS idx_rewards_archived_archived_at ON rewards_archived(archived_at);
CREATE INDEX IF NOT EXISTS idx_rewards_archived_cid ON rewards_archived(ipfs_cid);

-- User reward summary (cached, updated periodically)
CREATE TABLE IF NOT EXISTS user_reward_summary (
  user_address TEXT PRIMARY KEY,
  total_rewards INTEGER NOT NULL DEFAULT 0,
  total_grid_reward REAL NOT NULL DEFAULT 0,
  total_dapp_token_reward REAL NOT NULL DEFAULT 0,
  last_reward_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_reward_summary_updated ON user_reward_summary(updated_at);

-- Diamonds ledger (off-chain, cross-game)
-- Append-only entries with derived per-user summary for cheap Deck reads.
CREATE TABLE IF NOT EXISTS diamonds_ledger (
  id TEXT PRIMARY KEY,
  user_address TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('earn','spend')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- gameplay|payment_bonus|admin|partner|perk|boost|unlock|...
  game_id TEXT,
  reason TEXT,
  related_tx_hash TEXT,
  related_sku_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diamonds_ledger_user ON diamonds_ledger(user_address);
CREATE INDEX IF NOT EXISTS idx_diamonds_ledger_created ON diamonds_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_diamonds_ledger_related_tx ON diamonds_ledger(related_tx_hash);

CREATE TABLE IF NOT EXISTS user_diamonds_summary (
  user_address TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  earned_total INTEGER NOT NULL DEFAULT 0,
  spent_total INTEGER NOT NULL DEFAULT 0,
  last_event_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_diamonds_updated ON user_diamonds_summary(updated_at);

-- Verified L1 payments (idempotency + audit)
CREATE TABLE IF NOT EXISTS l1_payments_verified (
  id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  user_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_sompi INTEGER NOT NULL,
  game_id TEXT,
  sku_id TEXT,
  purchase_type TEXT,
  session_id TEXT,
  evm_address TEXT,
  verified_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_l1_payments_verified_user ON l1_payments_verified(user_address);
CREATE INDEX IF NOT EXISTS idx_l1_payments_verified_at ON l1_payments_verified(verified_at);

-- Per-user reward settings (auto-claim)
CREATE TABLE IF NOT EXISTS user_reward_settings (
  user_address TEXT PRIMARY KEY,
  auto_claim_enabled INTEGER NOT NULL DEFAULT 0,
  auto_claim_min_grid REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Distribution jobs (future-proof for real L2 GRID transfers)
CREATE TABLE IF NOT EXISTS grid_distribution_jobs (
  id TEXT PRIMARY KEY,
  user_address TEXT NOT NULL,
  total_grid REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued|sent|failed
  l2_tx_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grid_jobs_user ON grid_distribution_jobs(user_address);
CREATE INDEX IF NOT EXISTS idx_grid_jobs_status ON grid_distribution_jobs(status);
CREATE INDEX IF NOT EXISTS idx_grid_jobs_created ON grid_distribution_jobs(created_at);
