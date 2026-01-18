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
  ipfs_cid TEXT, -- Set when archived to IPFS
  INDEX idx_user (user_address),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  INDEX idx_tx_hash (tx_hash)
);

-- Archived rewards (CID references only, full data on IPFS)
CREATE TABLE IF NOT EXISTS rewards_archived (
  id TEXT PRIMARY KEY,
  ipfs_cid TEXT NOT NULL UNIQUE,
  user_address TEXT NOT NULL,
  dapp_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL,
  INDEX idx_user (user_address),
  INDEX idx_archived (archived_at),
  INDEX idx_cid (ipfs_cid)
);

-- User reward summary (cached, updated periodically)
CREATE TABLE IF NOT EXISTS user_reward_summary (
  user_address TEXT PRIMARY KEY,
  total_rewards INTEGER NOT NULL DEFAULT 0,
  total_grid_reward REAL NOT NULL DEFAULT 0,
  total_dapp_token_reward REAL NOT NULL DEFAULT 0,
  last_reward_at INTEGER,
  updated_at INTEGER NOT NULL,
  INDEX idx_updated (updated_at)
);
