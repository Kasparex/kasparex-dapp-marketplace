# 📋 Deployment Checklist

## Pre-Deployment

- [x] ✅ Project builds successfully (`npm run build`)
- [x] ✅ All TypeScript errors fixed
- [x] ✅ Dependencies installed
- [ ] ⏳ Create GitHub repository
- [ ] ⏳ Push code to GitHub
- [ ] ⏳ Create Cloudflare Pages project
- [ ] ⏳ Configure build settings
- [ ] ⏳ Set environment variables

## Cloudflare Resources

- [ ] ⏳ Create KV namespace (`wrangler kv:namespace create "KASPAREX_CACHE"`)
- [ ] ⏳ Create D1 database (`wrangler d1 create kasparex-nodes`)
- [ ] ⏳ Initialize D1 schema (`wrangler d1 execute kasparex-nodes --file=./workers/schema.sql`)
- [ ] ⏳ Create R2 bucket (`wrangler r2 bucket create kasparex-assets`)
- [ ] ⏳ Update `wrangler.toml` with resource IDs

## Deployment Steps

### 1. Deploy Pages

- [ ] ⏳ Connect GitHub repository to Cloudflare Pages
- [ ] ⏳ Set build command: `npm run build`
- [ ] ⏳ Set output directory: `public`
- [ ] ⏳ Set framework preset: `Remix`
- [ ] ⏳ Add environment variables
- [ ] ⏳ Deploy and verify URL works

### 2. Deploy Workers

- [ ] ⏳ Update `wrangler.toml` with resource IDs
- [ ] ⏳ Deploy Workers: `wrangler deploy`
- [ ] ⏳ Test API endpoint: `/health`
- [ ] ⏳ Set secrets (if needed): `wrangler secret put ...`

## Post-Deployment

- [ ] ⏳ Test Hub page loads
- [ ] ⏳ Test mobile menu
- [ ] ⏳ Test wallet connections
- [ ] ⏳ Test responsive design
- [ ] ⏳ Configure custom domain (if using)
- [ ] ⏳ Set up subdomains
- [ ] ⏳ Monitor for errors

## Quick Commands Reference

```bash
# Build
npm run build

# Create resources
wrangler kv:namespace create "KASPAREX_CACHE"
wrangler d1 create kasparex-nodes
wrangler d1 execute kasparex-nodes --file=./workers/schema.sql
wrangler r2 bucket create kasparex-assets

# Deploy
wrangler deploy

# Set secrets
wrangler secret put PINATA_API_KEY
wrangler secret put PINATA_API_SECRET
```

