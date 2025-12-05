-- Kasparex API D1 Database Schema
-- Run this to initialize the database: wrangler d1 execute kasparex-nodes --file=./schema.sql

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  node_id TEXT PRIMARY KEY,
  node_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('light', 'mirror', 'super')),
  owner_wallet TEXT NOT NULL,
  region TEXT NOT NULL,
  version TEXT NOT NULL,
  url TEXT,
  last_ping INTEGER NOT NULL,
  uptime_hours REAL DEFAULT 0,
  pinned_cids TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL
);

-- Node pings table (for uptime tracking)
CREATE TABLE IF NOT EXISTS node_pings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT DEFAULT 'ok',
  FOREIGN KEY (node_id) REFERENCES nodes(node_id) ON DELETE CASCADE
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  epoch_date TEXT NOT NULL,
  grt_amount REAL DEFAULT 0,
  lrt_amount REAL DEFAULT 0,
  krex_multiplier REAL DEFAULT 1.0,
  region_multiplier REAL DEFAULT 1.0,
  role_multiplier REAL DEFAULT 1.0,
  total_reward REAL DEFAULT 0,
  FOREIGN KEY (node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
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



