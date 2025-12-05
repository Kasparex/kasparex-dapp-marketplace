# 🚀 Start Here - Wrangler Development

## Quick Start

### 1. Build the Project

```bash
npm run build
```

### 2. Start Wrangler Dev Server

```bash
npm run start
```

**Or directly:**
```bash
wrangler pages dev ./public --port 8788
```

## What You'll See

After running `npm run start`, Wrangler will:
- Start a local Cloudflare Pages server
- Usually on `http://localhost:8788`
- Show the URL in the terminal

## Open in Browser

Once Wrangler starts, open:
```
http://localhost:8788
```

You should see the **Kasparex Hub** homepage!

## What's Configured

✅ Remix build output → `public/`  
✅ Cloudflare Pages functions → `functions/[[path]].ts`  
✅ Wrangler config → `wrangler.toml`  
✅ All dependencies → Installed and working  

## Development Workflow

1. **Make changes** to your code
2. **Rebuild**: `npm run build`
3. **Wrangler auto-reloads** (or restart with `npm run start`)

## Troubleshooting

### Port 8788 Already in Use?

Change the port:
```bash
wrangler pages dev ./public --port 3000
```

### Build Errors?

Make sure you've:
- ✅ Run `npm install`
- ✅ Fixed the `@base-org/account` patch (if needed)
- ✅ Run `npm run build` successfully

### Server Not Starting?

Check:
- Is port 8788 available?
- Did the build complete successfully?
- Are you in the `kasparex-hub` directory?

## Next Steps

Once the server is running:
1. ✅ Test the Hub page
2. ✅ Test mobile menu (click menu icon)
3. ✅ Test wallet connections
4. ✅ Test responsive design

## Need Help?

- See `WRANGLER_DEV.md` for detailed guide
- See `TROUBLESHOOTING.md` for common issues
- See `SETUP.md` for Cloudflare resources setup

