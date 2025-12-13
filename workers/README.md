# Kasparex API - Cloudflare Workers

This directory contains the Cloudflare Workers implementation for the Kasparex API.

## Setup

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Create Cloudflare Resources

#### KV Namespaces

Create two KV namespaces in Cloudflare Dashboard:

1. **KASPAREX_CACHE** - For caching static data
   ```bash
   wrangler kv:namespace create "KASPAREX_CACHE"
   wrangler kv:namespace create "KASPAREX_CACHE" --preview
   ```

2. **RATE_LIMIT** - For rate limiting (optional)
   ```bash
   wrangler kv:namespace create "RATE_LIMIT"
   wrangler kv:namespace create "RATE_LIMIT" --preview
   ```

Update `wrangler.toml` with the namespace IDs.

#### D1 Database

Create D1 database:

```bash
wrangler d1 create kasparex-nodes
```

Update `wrangler.toml` with the database ID.

Initialize schema:

```bash
wrangler d1 execute kasparex-nodes --file=./schema.sql
```

### 3. Set Environment Variables

Set secrets via Wrangler:

```bash
wrangler secret put REGISTRY_CID
wrangler secret put PINATA_API_KEY  # Optional
wrangler secret put STORACHA_API_KEY  # Optional
```

Or set in Cloudflare Dashboard → Workers → Settings → Variables.

### 4. Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

### 5. Deploy

Deploy to production:

```bash
npm run deploy:production
```

Or deploy to preview:

```bash
npm run deploy:preview
```

## API Endpoints

### Node Management

- `POST /kasparex/node/register` - Register a new node
- `POST /kasparex/node/ping` - Send heartbeat ping
- `GET /kasparex/nodes` - List all active nodes
- `GET /kasparex/node/:id` - Get node details
- `GET /kasparex/nodes/pinned/:cid` - Find nodes with specific CID

### Rewards

- `GET /kasparex/rewards/:nodeId` - Get rewards for a node
- `GET /kasparex/rewards/epoch/:epochDate` - Get epoch summary

### Public Data

- `GET /kasparex/stats` - Network statistics
- `GET /kasparex/dapps/availability?cid=...` - dApp mirror availability

### Health Check

- `GET /health` - Health check endpoint

## Rate Limiting

Rate limiting is enabled by default:
- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests with `Retry-After` header

To disable rate limiting, remove the `RATE_LIMIT` KV namespace from `wrangler.toml`.

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Database Schema

See `schema.sql` for the complete database schema.

## Environment Variables

- `REGISTRY_CID` - IPFS CID for registry (optional)
- `PINATA_API_KEY` - Pinata API key (optional)
- `STORACHA_API_KEY` - Storacha API key (optional)
- `KASPAREX_API_URL` - API base URL (optional)


