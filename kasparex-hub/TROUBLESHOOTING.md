# Troubleshooting Guide

## Issue: `with { type: 'json' }` Build Error

**Error:**
```
Expected ";" but found "with"
node_modules/@base-org/account/dist/core/constants.js:1:37
```

**Cause:** The `@base-org/account` package (dependency of wagmi/rainbowkit) uses modern JavaScript `import ... with { type: 'json' }` syntax which esbuild doesn't support yet.

**Temporary Workaround:**

1. **Option 1: Use Node.js 22+** (supports import attributes)
   ```bash
   node --version  # Should be 22+
   ```

2. **Option 2: Patch the package** (if Node 22+ not available)
   - The build might work despite the warning
   - Check if the dev server actually starts

3. **Option 3: Wait for esbuild update**
   - This is a known limitation
   - Future esbuild versions will support this

**Current Status:**
- CSS parsing errors: ✅ Fixed
- Build dependency error: ⚠️ Known issue, may not block dev server

## Check if Dev Server is Running

Even with the error, the dev server might still start. Check:
1. Look for a message like "Remix App Server started"
2. Check what port it's using
3. Try accessing `http://localhost:5173` or the port shown

## Alternative: Use Wrangler for Local Dev

If Remix dev server has issues, you can use Wrangler:

```bash
# Build first
npm run build

# Then start with Wrangler
npm run start
```

This uses Cloudflare's local development environment.

