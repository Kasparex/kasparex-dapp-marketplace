# Migration Summary: Vercel + Next.js with Cloudflare Workers

## Overview

Successfully migrated from Cloudflare Pages to Vercel + Next.js while preserving all existing design, styling, and UI components. Added Cloudflare Workers for backend API functionality.

## Changes Made

### Phase 1: Removed Cloudflare Pages Configuration ✅

1. **next.config.mjs**
   - Removed `output: 'export'` (enabled SSR)
   - Re-enabled image optimization
   - Removed Cloudflare-specific webpack cache disabling
   - Kept decentralized image patterns

2. **package.json**
   - Removed `@cloudflare/next-on-pages` dependency
   - Removed Cloudflare Pages build scripts (`prebuild`, `postbuild`, `build:cloudflare`, `pages:build`)
   - Kept Cloudflare Workers scripts

3. **vercel.json**
   - Already configured correctly for Next.js

### Phase 2: Cloudflare Workers API ✅

Created complete Cloudflare Workers API structure:

1. **workers/middleware.ts**
   - Rate limiting (100 req/min per IP)
   - CORS headers
   - Request logging
   - Error handling

2. **workers/kasparex-api/nodes.ts**
   - Node registration (`POST /kasparex/node/register`)
   - Node ping/heartbeat (`POST /kasparex/node/ping`)
   - List nodes (`GET /kasparex/nodes`)
   - Get node details (`GET /kasparex/node/:id`)
   - Find nodes by pinned CID (`GET /kasparex/nodes/pinned/:cid`)

3. **workers/kasparex-api/rewards.ts**
   - Reward calculation with multipliers:
     - Light Node: 2x multiplier
     - Mirror Node: 3x multiplier
     - Super Node: 5x multiplier
   - Region multipliers (underserved regions: 1.2x)
   - Get node rewards (`GET /kasparex/rewards/:nodeId`)
   - Get epoch summary (`GET /kasparex/rewards/epoch/:epochDate`)

4. **workers/kasparex-api/public.ts**
   - Network statistics (`GET /kasparex/stats`)
   - dApp availability (`GET /kasparex/dapps/availability`)

5. **workers/index.ts**
   - Main router with middleware integration
   - Routes all `/kasparex/*` requests to appropriate handlers

6. **workers/schema.sql**
   - D1 database schema for nodes, node_pings, and rewards tables
   - Indexes for performance

7. **workers/README.md**
   - Complete setup and deployment instructions

### Phase 3: Frontend API Integration ✅

1. **src/lib/api/client.ts**
   - Centralized API client for Cloudflare Workers
   - Error handling and retry logic
   - TypeScript types
   - Rate limit handling

2. **src/lib/storage/krex-nodes.ts**
   - Updated to use Cloudflare Workers API
   - Fetches nodes from `/kasparex/nodes/pinned/:cid`
   - Region-based sorting

3. **src/lib/storage/decentralized.ts**
   - Updated fallback from Cloudflare Pages to Vercel
   - Updated priority order (Krex Nodes first)
   - Uses new `krex-nodes.ts` module

### Phase 4: Configuration ✅

1. **wrangler.toml**
   - Added RATE_LIMIT KV namespace
   - Configured D1 database binding
   - Environment configurations

## Design Preservation ✅

**All existing design, styling, and layouts preserved:**

- ✅ `src/components/Header.tsx` - No changes
- ✅ `src/components/KasWareWalletButton.tsx` - No changes
- ✅ `src/components/EVMWalletButton.tsx` - No changes
- ✅ All other components - No UI/UX changes
- ✅ Only backend API integration updated

## Next Steps

### 1. Set Up Cloudflare Resources

```bash
# Create KV namespaces
wrangler kv:namespace create "KASPAREX_CACHE"
wrangler kv:namespace create "RATE_LIMIT"

# Create D1 database
wrangler d1 create kasparex-nodes

# Update wrangler.toml with IDs

# Initialize database
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
```

### 2. Set Environment Variables

In Vercel Dashboard:
- `NEXT_PUBLIC_KASPAREX_API_URL` - Cloudflare Workers API URL

In Cloudflare Dashboard (Workers → Settings → Variables):
- `REGISTRY_CID` - Optional
- `PINATA_API_KEY` - Optional
- `STORACHA_API_KEY` - Optional

### 3. Deploy

```bash
# Deploy Cloudflare Workers
cd workers
npm run deploy:production

# Deploy Next.js to Vercel
# (via Vercel Dashboard or CLI)
```

### 4. Test

- Test API endpoints: `/health`, `/kasparex/stats`
- Test node registration and pings
- Test asset resolution with Krex Nodes
- Verify all existing UI components work

## Files Created

- `workers/middleware.ts`
- `workers/kasparex-api/nodes.ts`
- `workers/kasparex-api/rewards.ts`
- `workers/kasparex-api/public.ts`
- `workers/schema.sql`
- `workers/README.md`
- `src/lib/api/client.ts`
- `src/lib/storage/krex-nodes.ts`

## Files Modified

- `next.config.mjs` - Removed Cloudflare Pages config
- `package.json` - Removed Cloudflare Pages dependencies
- `wrangler.toml` - Added RATE_LIMIT KV namespace
- `workers/index.ts` - Updated to use new API structure
- `src/lib/storage/decentralized.ts` - Updated to use Workers API and Vercel fallback

## Files Preserved (No Changes)

- `src/components/Header.tsx`
- `src/components/KasWareWalletButton.tsx`
- `src/components/EVMWalletButton.tsx`
- All other UI components

## API Endpoints

### Node Management
- `POST /kasparex/node/register`
- `POST /kasparex/node/ping`
- `GET /kasparex/nodes`
- `GET /kasparex/node/:id`
- `GET /kasparex/nodes/pinned/:cid`

### Rewards
- `GET /kasparex/rewards/:nodeId`
- `GET /kasparex/rewards/epoch/:epochDate`

### Public Data
- `GET /kasparex/stats`
- `GET /kasparex/dapps/availability?cid=...`

### Health
- `GET /health`

## Cost Estimate

- **Vercel**: FREE (Hobby plan) or $20/month (Pro)
- **Cloudflare Workers**: $5-10/month
- **Total**: $5-30/month

## Notes

- Rate limiting: 100 requests/minute per IP (configurable)
- CORS: Enabled for all origins
- Database: D1 SQLite (Cloudflare's edge database)
- Caching: KV namespaces for static data
- All existing UI components preserved exactly as they were


