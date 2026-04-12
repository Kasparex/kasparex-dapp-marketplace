# Fix: Cloudflare Pages 404 Error

## Problem

Site deployed to Cloudflare Pages but shows **HTTP 404** error when accessing `https://kasparex.pages.dev/`

## Root Cause

Next.js apps need special configuration for Cloudflare Pages:
1. **Static Export**: For simple static sites (no server-side features)
2. **Adapter**: For full Next.js features (SSR, API routes, etc.)

The default Next.js build output (`.next` directory) doesn't work directly on Cloudflare Pages.

## Solution Implemented

### Option 1: Static Export (Current)

**Configuration**: `next.config.mjs`

```javascript
output: process.env.CF_PAGES ? 'export' : undefined,
images: {
  unoptimized: process.env.CF_PAGES ? true : false,
  // ... remote patterns
}
```

**Build Command**: `CF_PAGES=1 next build`

**Output Directory**: `out` (Next.js static export output)

**Pros:**
- ✅ Simple, works immediately
- ✅ Fast deployment
- ✅ No adapter needed

**Cons:**
- ❌ No server-side rendering (SSR)
- ❌ No API routes
- ❌ No dynamic routes at build time

### Option 2: Cloudflare Adapter (For Full Features)

If you need SSR, API routes, or dynamic features:

**Install**: `@cloudflare/next-on-pages` (already installed)

**Build Command**: 
```bash
next build && npx @cloudflare/next-on-pages
```

**Output Directory**: `.vercel/output/static`

**Note**: The adapter is deprecated, but still works. Consider migrating to OpenNext in the future.

## Cloudflare Pages Settings

Update your Cloudflare Pages build settings:

### For Static Export (Recommended for now):

```
Build command: CF_PAGES=1 npm run build
Build output directory: out
Root directory: /
Node version: 18 or 20
```

### For Adapter (If you need SSR):

```
Build command: npm run build && npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
Root directory: /
Node version: 18 or 20
```

## Environment Variables

Add to Cloudflare Pages → Settings → Environment variables:

```
CF_PAGES=1
```

This enables the static export mode in Next.js.

## Testing Locally

Test the static export locally:

```bash
# Set environment variable
export CF_PAGES=1  # Linux/Mac
set CF_PAGES=1     # Windows PowerShell
$env:CF_PAGES=1    # Windows CMD

# Build
npm run build

# Check output
ls out/  # Should see HTML files

# Test locally (optional)
npx serve out
```

## Migration Path

### Current: Static Export
- Works for client-side apps
- Good for most dApp marketplaces
- Fast and simple

### Future: Full Next.js Features
If you need:
- Server-side rendering
- API routes (`/api/*`)
- Dynamic routes with SSR
- Middleware

Then migrate to the adapter or consider:
- **Vercel** (best Next.js support)
- **OpenNext** (newer Cloudflare adapter)
- **Cloudflare Workers** (for API routes)

## Verification

After updating Cloudflare Pages settings:

1. ✅ Build completes successfully
2. ✅ Output directory contains `index.html`
3. ✅ Site loads at `https://kasparex.pages.dev/`
4. ✅ No 404 errors

## Troubleshooting

### Still seeing 404?

1. **Check build output directory**:
   - Should be `out` for static export
   - Should be `.vercel/output/static` for adapter

2. **Check build logs**:
   - Look for "Export successful" message
   - Verify `index.html` is generated

3. **Check Cloudflare settings**:
   - Build output directory matches actual output
   - Build command includes `CF_PAGES=1`

4. **Clear cache**:
   - Cloudflare Dashboard → Caching → Purge Everything
   - Wait a few minutes

### Build fails?

1. **Check for dynamic features**:
   - Static export doesn't support SSR
   - Remove or replace with client-side alternatives

2. **Check for API routes**:
   - Move to Cloudflare Workers
   - Or use client-side API calls

3. **Check for middleware**:
   - Not supported in static export
   - Use client-side routing instead

## Next Steps

1. ✅ Update Cloudflare Pages build settings
2. ✅ Add `CF_PAGES=1` environment variable
3. ✅ Change output directory to `out`
4. ✅ Redeploy
5. ✅ Test site loads correctly

## References

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

