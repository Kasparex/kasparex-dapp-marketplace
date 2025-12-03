# Cloudflare Pages Deployment Fix

## Problem

Cloudflare Pages deployment was failing with:
```
✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
cache/webpack/server-production/0.pack is 294 MiB in size
```

## Root Cause

Next.js webpack was creating large cache files (294 MiB) during the build process. These cache files were being included in the `.next` output directory, which Cloudflare Pages tries to deploy. Cloudflare Pages has a **25 MiB file size limit** per file.

## Solution

We've implemented a three-part solution:

### 1. Disable Webpack Cache in Production

**File**: `next.config.mjs`

```javascript
webpack: (config, { isServer, webpack, dev }) => {
  // Disable webpack cache in production builds
  if (!dev) {
    config.cache = false;
  }
  // ... rest of config
}
```

This prevents webpack from creating cache files during production builds.

### 2. Post-Build Cache Cleanup

**File**: `scripts/clean-build-cache.js`

A Node.js script that removes any cache files that might have been created:

```bash
npm run build:cloudflare
```

This script:
- Deletes `.next/cache` directory
- Deletes `.next/cache/webpack` directory
- Deletes `.next/server-production` directory
- Removes any `.pack` or `.cache` files

### 3. Cloudflare Ignore File

**File**: `.cloudflareignore`

Excludes cache directories from deployment:

```
.next/cache/
.next/server-production/
**/cache/webpack/
**/cache/
```

## Updated Build Command for Cloudflare Pages

In your Cloudflare Pages dashboard, update the build command to:

```bash
npm run build:cloudflare
```

Or if you prefer to keep the standard build command, you can add the cleanup as a separate step:

**Build command**: `npm run build`  
**Post-build command**: `node scripts/clean-build-cache.js`

## Alternative: Environment Variable

You can also set an environment variable in Cloudflare Pages:

```
NODE_ENV=production
CF_PAGES=1
```

And use the standard build command: `npm run build`

The webpack config will automatically disable cache when `NODE_ENV=production`.

## Verification

After deployment, check the Cloudflare Pages logs to ensure:
1. ✅ No cache files are being uploaded
2. ✅ Build completes successfully
3. ✅ No file size errors

## File Size Limits

- **Cloudflare Pages**: 25 MiB per file
- **Total deployment**: 500 MiB (free tier)
- **Total deployment**: Unlimited (paid tier)

## Additional Optimizations

The config also includes:

```javascript
experimental: {
  optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
}
```

This reduces bundle size by optimizing imports from large packages.

## Troubleshooting

### Still seeing cache files?

1. Check `.cloudflareignore` is in the root directory
2. Verify `build:cloudflare` script runs the cleanup
3. Check Cloudflare Pages build logs for cache file warnings

### Build is slow?

Disabling cache makes builds slower, but it's necessary for Cloudflare Pages. Consider:
- Using Cloudflare's build cache (if available)
- Optimizing dependencies
- Using Next.js standalone output mode

### Need cache for local development?

Cache is only disabled in production builds (`!dev`). Local development (`npm run dev`) still uses cache for faster rebuilds.

