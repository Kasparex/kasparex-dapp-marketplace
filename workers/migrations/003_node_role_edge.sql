-- Allow node role `edge` (rename from legacy `mirror`).
-- Run once: wrangler d1 execute kasparex-nodes --remote --file=./migrations/003_node_role_edge.sql

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS nodes_role_edge (
  node_id TEXT PRIMARY KEY,
  node_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('light', 'edge', 'super', 'mirror')),
  owner_wallet TEXT NOT NULL,
  region TEXT,
  version TEXT,
  url TEXT NOT NULL,
  last_ping INTEGER,
  uptime_hours REAL DEFAULT 0,
  pinned_cids TEXT,
  created_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  requests_served_total INTEGER NOT NULL DEFAULT 0,
  requests_served_epoch INTEGER NOT NULL DEFAULT 0,
  last_seq INTEGER NOT NULL DEFAULT 0,
  binding_version INTEGER NOT NULL DEFAULT 0,
  verified_txid TEXT,
  verified_at INTEGER,
  anomaly_flags INTEGER NOT NULL DEFAULT 0,
  created_from_ip_hash TEXT
);

INSERT INTO nodes_role_edge (
  node_id, node_name, role, owner_wallet, region, version, url,
  last_ping, uptime_hours, pinned_cids, created_at, status,
  requests_served_total, requests_served_epoch, last_seq, binding_version,
  verified_txid, verified_at, anomaly_flags, created_from_ip_hash
)
SELECT
  node_id,
  node_name,
  CASE WHEN role = 'mirror' THEN 'edge' ELSE role END,
  owner_wallet,
  region,
  version,
  url,
  last_ping,
  uptime_hours,
  pinned_cids,
  created_at,
  status,
  requests_served_total,
  requests_served_epoch,
  last_seq,
  binding_version,
  verified_txid,
  verified_at,
  anomaly_flags,
  created_from_ip_hash
FROM nodes;

DROP TABLE nodes;
ALTER TABLE nodes_role_edge RENAME TO nodes;

CREATE INDEX IF NOT EXISTS idx_nodes_last_ping ON nodes(last_ping);
CREATE INDEX IF NOT EXISTS idx_nodes_region ON nodes(region);
CREATE INDEX IF NOT EXISTS idx_nodes_role ON nodes(role);

PRAGMA foreign_keys=ON;
