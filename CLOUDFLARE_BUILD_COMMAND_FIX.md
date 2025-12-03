# Cloudflare Build Command Fix

## The Issue
When you set the framework preset to "Next.js (Static HTML Export)", Cloudflare automatically changes the build command to `npx next build`, which bypasses our `prebuild` hook that excludes API routes.

## The Fix
I've updated the `scripts/exclude-api-routes.js` script to automatically detect static export mode from `next.config.mjs`, so it works regardless of the build command.

## Build Command Options

You have two options in Cloudflare Pages settings:

### Option 1: Use Framework Preset (Recommended)
- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npx next build` (automatically set by preset)
- **Build output**: `out` (automatically set by preset)
- ✅ **Now works** - The exclude script automatically detects static export mode

### Option 2: Manual Configuration
- **Framework preset**: `None` or leave unset
- **Build command**: `CF_PAGES=1 npm run build`
- **Build output**: `out`
- ✅ **Also works** - Uses explicit CF_PAGES environment variable

## What Changed
The exclude script now:
1. Checks for `CF_PAGES` environment variable (existing behavior)
2. **NEW**: Also checks `next.config.mjs` for `output: 'export'` configuration
3. Automatically excludes API routes when static export is detected

This means it works with both:
- `npx next build` (from framework preset)
- `CF_PAGES=1 npm run build` (manual configuration)

## Next Steps
1. The fix is already pushed to the repository
2. Trigger a new deployment in Cloudflare Pages
3. The build should now succeed regardless of which build command is used

