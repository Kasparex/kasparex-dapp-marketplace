-- Kasparex API D1  -  Krex Nodes + GRID operator rewards (fresh install).
-- Migrations: workers/migrations/001_krex_nodes_v2.sql for upgrades from legacy grt/lrt.

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
  pinned_cids TEXT,
  created_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  requests_served_total INTEGER NOT NULL DEFAULT 0,
  requests_served_epoch INTEGER NOT NULL DEFAULT 0,
  last_seq INTEGER NOT NULL DEFAULT 0,
  binding_version INTEGER NOT NULL DEFAULT 0,
  verified_txid TEXT,
  verified_at INTEGER,
  anomaly_flags INTEGER NOT NULL DEFAULT 0,
  created_from_ip_hash TEXT
);

CREATE TABLE IF NOT EXISTS node_uptime_slices (
  node_id TEXT NOT NULL,
  hour_ts INTEGER NOT NULL,
  ping_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (node_id, hour_ts),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);

-- Wallet-level on-chain verification (sybil resistance).
CREATE TABLE IF NOT EXISTS wallet_verifications (
  wallet TEXT PRIMARY KEY,
  verified_txid TEXT NOT NULL,
  verified_at INTEGER NOT NULL
);

-- Legacy table kept empty on new installs; migration may still reference for drop.
CREATE TABLE IF NOT EXISTS node_pings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('online', 'offline')),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL,
  wallet TEXT NOT NULL DEFAULT '',
  epoch_date TEXT NOT NULL,
  base_grid REAL NOT NULL DEFAULT 0,
  final_grid REAL NOT NULL DEFAULT 0,
  krex_multiplier REAL DEFAULT 1.0,
  region_multiplier REAL DEFAULT 1.0,
  role_multiplier REAL NOT NULL DEFAULT 1.0,
  inputs_json TEXT,
  multipliers_json TEXT,
  payout_status TEXT NOT NULL DEFAULT 'accrued' CHECK(payout_status IN ('accrued', 'paid', 'void')),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  UNIQUE(node_id, epoch_date)
);

CREATE INDEX IF NOT EXISTS idx_nodes_last_ping ON nodes(last_ping);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nodes(region);
CREATE INDEX IF NOT EXISTS idx_nodes_role ON nodes(role);
CREATE INDEX IF NOT EXISTS idx_node_pings_node_id ON node_pings(node_id);
CREATE INDEX IF NOT EXISTS idx_node_pings_timestamp ON node_pings(timestamp);
CREATE INDEX IF NOT EXISTS idx_rewards_node_id ON rewards(node_id);
CREATE INDEX IF NOT EXISTS idx_rewards_epoch_date ON rewards(epoch_date);
CREATE INDEX IF NOT EXISTS idx_uptime_slices_hour ON node_uptime_slices(hour_ts);
