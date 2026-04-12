-- Kasparex API D1 Database Schema
-- 
-- Run this with: wrangler d1 execute kasparex-nodes --file=./workers/schema.sql

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  node_id TEXT PRIMARY KEY,
  node_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('light', 'mirror', 'super')),
  owner_wallet TEXT NOT NULL,
  region TEXT,
  version TEXT,
  url TEXT NOT NULL,
  last_ping INTEGER,
  uptime_hours REAL DEFAULT 0,
  pinned_cids TEXT, -- JSON array
  created_at INTEGER
);

-- Node pings table (for tracking uptime)
CREATE TABLE IF NOT EXISTS node_pings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('online', 'offline')),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  epoch_date TEXT NOT NULL,
  grt_amount REAL NOT NULL,
  lrt_amount REAL NOT NULL,
  krex_multiplier REAL DEFAULT 1.0,
  region_multiplier REAL DEFAULT 1.0,
  role_multiplier REAL NOT NULL, -- 2.0, 3.0, or 5.0
  total_reward REAL NOT NULL,
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  UNIQUE(node_id, epoch_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_last_ping ON nodes(last_ping);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nodes(region);
CREATE INDEX IF NOT EXISTS idx_nodes_role ON nodes(role);
CREATE INDEX IF NOT EXISTS idx_node_pings_node_id ON node_pings(node_id);
CREATE INDEX IF NOT EXISTS idx_node_pings_timestamp ON node_pings(timestamp);
CREATE INDEX IF NOT EXISTS idx_rewards_node_id ON rewards(node_id);
CREATE INDEX IF NOT EXISTS idx_rewards_epoch_date ON rewards(epoch_date);

