-- Kasparex Index Listings Database Schema
-- D1 Database schema for storing listing metadata and indexes

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY, -- Transaction hash (unique listing ID)
  ipfs_cid TEXT NOT NULL, -- IPFS CID for metadata JSON
  name TEXT NOT NULL, -- Cached from IPFS for fast queries
  description TEXT, -- Optional, can fetch from IPFS if needed
  category TEXT NOT NULL, -- ListingCategory enum value
  tags TEXT NOT NULL, -- JSON array, cached for filtering
  owner_wallet TEXT NOT NULL, -- Wallet address that created the listing
  timestamp INTEGER NOT NULL, -- Transaction timestamp
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'archived'
  created_at INTEGER NOT NULL, -- Database insertion timestamp
  updated_at INTEGER NOT NULL -- Last update timestamp
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_owner ON listings(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_timestamp ON listings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ipfs_cid ON listings(ipfs_cid);

-- Example queries:
-- SELECT * FROM listings WHERE category = 'dApps' AND status = 'active' ORDER BY timestamp DESC;
-- SELECT * FROM listings WHERE owner_wallet = 'kaspa:...' ORDER BY timestamp DESC;
-- SELECT * FROM listings WHERE tags LIKE '%"defi"%' AND status = 'active';

