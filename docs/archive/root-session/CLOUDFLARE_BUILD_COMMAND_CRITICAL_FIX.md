# 🚨 CRITICAL: Build Command Fix

## The Problem
Your Cloudflare Pages build command is set to `npx next build`, which **bypasses npm scripts** and never runs the `prebuild` hook that excludes API routes.

## The Solution
**Change the build command from `npx next build` to `npm run build`**

### Steps:
1. Go to Cloudflare Dashboard → Workers & Pages → kasparex → Settings
2. Click the edit icon (pencil) next to "Build configuration"
3. In the "Build command" field, change:
   - **FROM**: `npx next build`
   - **TO**: `npm run build`
4. Click "Save"
5. Trigger a new deployment

## Why This Matters
- `npx next build` → Bypasses npm scripts, `prebuild` hook never runs → API routes not excluded → Build fails
- `npm run build` → Runs npm scripts, `prebuild` hook runs → API routes excluded → Build succeeds

## Current Configuration Should Be:
- **Framework preset**: `Next.js (Static HTML Export)` ✅ (Correct)
- **Build command**: `npm run build` ⚠️ **MUST CHANGE FROM `npx next build`**
- **Build output directory**: `out` ✅ (Correct)
- **Root directory**: `/` or empty ✅ (Correct)

## What Happens When You Use `npm run build`:
1. `prebuild` hook runs → `scripts/exclude-api-routes.js` executes
2. Script detects static export from `next.config.mjs`
3. Script moves `src/app/api` → `api-backup/`
4. `next build` runs (without API routes)
5. Build succeeds
6. `postbuild` hook runs → Restores API routes

## Alternative (If Framework Preset Overrides Build Command):
If the framework preset keeps resetting the build command to `npx next build`, you can:
1. Set Framework preset to "None" (or unset it)
2. Manually set:
   - Build command: `npm run build`
   - Build output: `out`

