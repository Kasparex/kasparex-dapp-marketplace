# Quick Fix: Cloudflare Pages 404 Error

## ✅ Problem Fixed

Your site shows **HTTP 404** because Next.js needs special configuration for Cloudflare Pages.

## 🔧 Solution Applied

I've configured Next.js to use **static export** mode for Cloudflare Pages.

## 🚀 Action Required: Update Cloudflare Pages Settings

### Step 1: Update Build Settings

1. Go to **Cloudflare Dashboard** → **Pages** → **kasparex**
2. Go to **Settings** → **Builds & deployments**
3. Update these settings:

```
Build command: CF_PAGES=1 npm run build
Build output directory: out
Root directory: /
Node version: 18 or 20
```

### Step 2: Add Environment Variable

1. Still in **Settings** → **Environment variables**
2. Add new variable:

```
CF_PAGES=1
```

3. Make sure it's set for **Production** environment
4. Save

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment
3. Or wait for automatic deployment (should trigger automatically)

## ✅ Verification

After redeploying, check:

1. ✅ Build completes successfully
2. ✅ Output directory is `out` (not `.next`)
3. ✅ Site loads at `https://kasparex.pages.dev/`
4. ✅ No 404 errors

## 📝 What Changed

- **next.config.mjs**: Added static export mode when `CF_PAGES=1`
- **package.json**: Updated build command
- **Output**: Now generates `out/` directory with static HTML files

## ⚠️ Important Notes

**Static Export Limitations:**
- ❌ No server-side rendering (SSR)
- ❌ No API routes (`/api/*`)
- ❌ No dynamic routes at build time

**What Still Works:**
- ✅ Client-side routing
- ✅ Client-side data fetching
- ✅ Static pages
- ✅ All React features
- ✅ Wallet connections
- ✅ dApp marketplace features

If you need SSR or API routes later, we can migrate to the Cloudflare adapter.

## 🐛 Troubleshooting

### Still seeing 404?

1. **Check build output directory**: Must be `out` (not `.next`)
2. **Check environment variable**: `CF_PAGES=1` must be set
3. **Check build logs**: Look for "Export successful" message
4. **Clear cache**: Cloudflare Dashboard → Caching → Purge Everything

### Build fails?

Check build logs for errors. Common issues:
- Dynamic routes that can't be statically exported
- API routes (move to Cloudflare Workers)
- Server-side features (use client-side alternatives)

## 📚 Full Documentation

See `docs/CLOUDFLARE_404_FIX.md` for detailed explanation and migration options.

