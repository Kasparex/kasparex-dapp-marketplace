# Cloudflare Pages Setup Guide

## ✅ Correct Configuration

### 1. Framework Preset
**CRITICAL**: Set the framework preset to **"Next.js (Static HTML Export)"** in Cloudflare Pages settings.

This preset automatically:
- Configures Next.js for static export
- Sets the correct build command
- Handles the output directory
- Ensures proper static generation

### 2. Build Configuration

In Cloudflare Pages Settings → Build configuration:

- **Framework preset**: `Next.js (Static HTML Export)` ⚠️ **MUST BE SET**
- **Build command**: `npm run build` (or `pnpm run build` if using pnpm)
- **Build output directory**: `out`
- **Root directory**: `/` (leave empty or set to `/`)

### 3. Environment Variables

Add these in Cloudflare Pages → Settings → Variables and Secrets:

- `CF_PAGES=1` (optional, but helps with detection)
- `NODE_VERSION=22` (or your preferred Node version)

### 4. Build Command Simplification

Since we're using the framework preset, we can simplify the build command. The preset handles the static export configuration automatically.

**Current build command**: `CF_PAGES=1 npm run build`
**Can be simplified to**: `npm run build` (if using the preset)

However, if you want to keep explicit control, keep `CF_PAGES=1 npm run build`.

## 🔧 Troubleshooting

### Issue: "missing generateStaticParams()" error

**Solution**: 
1. Ensure framework preset is set to "Next.js (Static HTML Export)"
2. Verify all dynamic route pages have `generateStaticParams()` exported
3. Check that the function is at the top level of the file
4. Ensure the function has an explicit return type

### Issue: Build still fails

**Try these steps**:
1. Clear Cloudflare Pages build cache (if available)
2. Verify all files are committed and pushed
3. Check that `next.config.mjs` has `output: 'export'` when `CF_PAGES=1`
4. Ensure API routes are excluded during build (handled by prebuild script)

## 📋 Current Status

All dynamic routes have been fixed:
- ✅ `/user/[wallet-address]` - async + PageProps
- ✅ `/vblog/author/[address]` - async + PageProps  
- ✅ `/vblog/[slug]` - async + PageProps
- ✅ `/dapps/[slug]` - async + PageProps
- ✅ `/dapps/[slug]/embed` - async + PageProps
- ✅ `/dapps/[slug]/edit` - async + PageProps
- ✅ `/knowledge-base/[slug]` - async + PageProps

## 🚀 Next Steps

1. **Set Framework Preset**: Go to Cloudflare Pages → Settings → Build configuration → Framework preset → Select "Next.js (Static HTML Export)"

2. **Verify Build Command**: Should be `npm run build` or `CF_PAGES=1 npm run build`

3. **Verify Output Directory**: Should be `out`

4. **Redeploy**: Trigger a new deployment after setting the framework preset

## ⚠️ Important Notes

- The framework preset is **critical** - it tells Cloudflare how to handle Next.js builds
- Without the preset, Cloudflare may not recognize the static export configuration
- The preset automatically configures many settings that we're currently doing manually

