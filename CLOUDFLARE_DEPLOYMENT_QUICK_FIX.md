# Quick Fix: Cloudflare Pages 25 MiB File Limit

## ✅ Problem Fixed

The deployment error:
```
✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
cache/webpack/server-production/0.pack is 294 MiB in size
```

Has been resolved with the following changes:

## 🔧 Changes Made

1. **Disabled webpack cache in production** (`next.config.mjs`)
   - Prevents creation of large cache files during build

2. **Added post-build cleanup script** (`scripts/clean-build-cache.js`)
   - Removes any cache files that might have been created

3. **Created `.cloudflareignore` file**
   - Excludes cache directories from deployment

4. **Updated build script** (`package.json`)
   - Added `build:cloudflare` command that includes cleanup

## 🚀 Next Steps

### Option 1: Update Cloudflare Pages Build Command (Recommended)

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Go to **Settings** → **Builds & deployments**
3. Update **Build command** to:
   ```
   npm run build:cloudflare
   ```
4. Save and redeploy

### Option 2: Use Post-Build Command

1. Keep build command as: `npm run build`
2. Add **Post-build command**: `node scripts/clean-build-cache.js`
3. Save and redeploy

## ✅ Verification

After redeploying, check the build logs:
- ✅ No "25 MiB" errors
- ✅ Build completes successfully
- ✅ No cache files in deployment

## 📚 Full Documentation

See `docs/CLOUDFLARE_PAGES_FIX.md` for detailed explanation.

