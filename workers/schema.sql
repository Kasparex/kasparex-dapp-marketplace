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

-- --------------------------------------------------
-- Promo Engine Tables (Tokens, Promo Pages, Mints)
-- --------------------------------------------------

-- Tokens table (off-chain registry for promo engine)
CREATE TABLE IF NOT EXISTS promo_tokens (
  id TEXT PRIMARY KEY,                 -- tokenId / slug
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,               -- e.g. 'igraCaravelTestnet'
  mint_price REAL NOT NULL,
  tokens_per_mint INTEGER NOT NULL,
  mintable_supply INTEGER NOT NULL,
  minted_so_far INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE','COMPLETED','ARCHIVED'
  creator_wallet TEXT NOT NULL,
  platform_wallet TEXT NOT NULL,
  genesis_page_id TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Promo pages table
CREATE TABLE IF NOT EXISTS promo_pages (
  id TEXT PRIMARY KEY,                 -- pageId
  token_id TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  slot1_wallet TEXT NOT NULL,
  slot2_wallet TEXT NOT NULL,
  slot3_wallet TEXT NOT NULL,
  slot4_wallet TEXT NOT NULL,
  slot5_wallet TEXT NOT NULL,
  slot1_label TEXT,
  slot2_label TEXT,
  slot3_label TEXT,
  slot4_label TEXT,
  slot5_label TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE','ARCHIVED'
  total_mints INTEGER NOT NULL DEFAULT 0,
  total_volume REAL NOT NULL DEFAULT 0,
  earn_slot1 REAL NOT NULL DEFAULT 0,
  earn_slot2 REAL NOT NULL DEFAULT 0,
  earn_slot3 REAL NOT NULL DEFAULT 0,
  earn_slot4 REAL NOT NULL DEFAULT 0,
  earn_slot5 REAL NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- Mint events table
CREATE TABLE IF NOT EXISTS promo_mint_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  minter_wallet TEXT NOT NULL,
  mint_count INTEGER NOT NULL,
  mint_price REAL NOT NULL,
  total_paid REAL NOT NULL,
  creator_amount REAL NOT NULL,
  platform_amount REAL NOT NULL,
  slot1_amount REAL NOT NULL,
  slot2_amount REAL NOT NULL,
  slot3_amount REAL NOT NULL,
  slot4_amount REAL NOT NULL,
  slot5_amount REAL NOT NULL,
  slot1_before TEXT NOT NULL,
  slot2_before TEXT NOT NULL,
  slot3_before TEXT NOT NULL,
  slot4_before TEXT NOT NULL,
  slot5_before TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  network TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  ip_address TEXT,
  user_agent_hash TEXT
);

-- Rate limiting table (per wallet/IP)
CREATE TABLE IF NOT EXISTS promo_rate_limiting (
  key TEXT PRIMARY KEY,          -- wallet address or IP address
  mint_count INTEGER NOT NULL DEFAULT 0,
  last_mint_at INTEGER,
  daily_reset_at INTEGER,
  blocked_until INTEGER,
  suspicious_score INTEGER NOT NULL DEFAULT 0
);

-- reCAPTCHA verification tokens
CREATE TABLE IF NOT EXISTS promo_recaptcha_verifications (
  id TEXT PRIMARY KEY,           -- reCAPTCHA token or derived ID
  wallet_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  verified_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

-- Indexes for promo engine
CREATE INDEX IF NOT EXISTS idx_promo_tokens_status ON promo_tokens(status);
CREATE INDEX IF NOT EXISTS idx_promo_pages_token_owner ON promo_pages(token_id, owner_wallet);
CREATE INDEX IF NOT EXISTS idx_promo_pages_token_status ON promo_pages(token_id, status);
CREATE INDEX IF NOT EXISTS idx_promo_mint_events_token_time ON promo_mint_events(token_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_promo_mint_events_minter_time ON promo_mint_events(minter_wallet, timestamp);
CREATE INDEX IF NOT EXISTS idx_promo_rate_limiting_key ON promo_rate_limiting(key);
CREATE INDEX IF NOT EXISTS idx_promo_recaptcha_wallet ON promo_recaptcha_verifications(wallet_address, verified_at);



