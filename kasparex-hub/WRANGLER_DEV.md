# Wrangler Development Guide

## Quick Start

### 1. Build the Project

```bash
npm run build
```

### 2. Start Wrangler Dev Server

```bash
npm run start
```

Or directly:
```bash
wrangler pages dev ./public --port 8788
```

## What Wrangler Does

- Serves your Remix app locally using Cloudflare's runtime
- Simulates Cloudflare Pages environment
- Usually runs on `http://localhost:8788`
- Supports Workers, KV, D1, R2 (if configured)

## Development Workflow

### Option 1: Build + Wrangler (Recommended)

```bash
# Build first
npm run build

# Then start Wrangler
npm run start
```

### Option 2: Watch Mode (Future)

For faster iteration, you can set up watch mode:

```bash
# Terminal 1: Watch and rebuild
npm run dev

# Terminal 2: Run Wrangler
npm run start
```

## Configuration

- **Build output**: `./public` (contains `build/` subdirectory)
- **Port**: `8788` (default, can be changed)
- **Config**: `wrangler.toml`

## Troubleshooting

### Port Already in Use

Change the port:
```bash
wrangler pages dev ./public --port 3000
```

### Build Not Found

Make sure you've run `npm run build` first.

### Functions Not Working

Check that `server.ts` exists and is properly configured for Cloudflare Pages.

## Next Steps

Once Wrangler is running:
1. Open `http://localhost:8788` in your browser
2. Test the Hub page
3. Test wallet connections
4. Test mobile menu

