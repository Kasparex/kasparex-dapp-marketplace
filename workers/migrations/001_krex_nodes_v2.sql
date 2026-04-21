-- Upgrade existing NODES_DB from legacy rewards (grt/lrt) + uptime slices.
-- Run once per database: wrangler d1 execute DB_NAME --file=./workers/migrations/001_krex_nodes_v2.sql
--
-- If any ALTER TABLE nodes ADD COLUMN fails (column already exists), skip that line and continue.

ALTER TABLE nodes ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE nodes ADD COLUMN requests_served_total INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN requests_served_epoch INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN last_seq INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN binding_version INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN anomaly_flags INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN created_from_ip_hash TEXT;

-- Hourly uptime buckets (replaces high-volume node_pings usage)
CREATE TABLE IF NOT EXISTS node_uptime_slices (
  node_id TEXT NOT NULL,
  hour_ts INTEGER NOT NULL,
  ping_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (node_id, hour_ts),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);
CREATE INDEX IF NOT EXISTS idx_uptime_slices_hour ON node_uptime_slices(hour_ts);

DROP TABLE IF EXISTS rewards_new;

-- Rewards: migrate from grt_amount/lrt_amount to GRID-only columns
CREATE TABLE rewards_new (
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
  payout_status TEXT NOT NULL DEFAULT 'accrued' CHECK(payout_status IN ('accrued','paid','void')),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id),
  UNIQUE(node_id, epoch_date)
);

INSERT OR IGNORE INTO rewards_new (
  node_id, wallet, epoch_date, base_grid, final_grid,
  krex_multiplier, region_multiplier, role_multiplier, inputs_json, multipliers_json, payout_status
)
SELECT
  r.node_id,
  COALESCE(n.owner_wallet, ''),
  r.epoch_date,
  COALESCE(r.grt_amount, 0) + COALESCE(r.lrt_amount, 0),
  COALESCE(r.total_reward, 0),
  COALESCE(r.krex_multiplier, 1.0),
  COALESCE(r.region_multiplier, 1.0),
  COALESCE(r.role_multiplier, 1.0),
  '{}',
  '{}',
  'accrued'
FROM rewards r
LEFT JOIN nodes n ON n.node_id = r.node_id;

DROP TABLE IF EXISTS rewards;
ALTER TABLE rewards_new RENAME TO rewards;

CREATE INDEX IF NOT EXISTS idx_rewards_node_id ON rewards(node_id);
CREATE INDEX IF NOT EXISTS idx_rewards_epoch_date ON rewards(epoch_date);
