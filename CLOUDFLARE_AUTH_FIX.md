# Cloudflare Authentication Fix

## Issue
OAuth error: "state parameter must be at least 8 characters long"

## Solutions

### Option 1: Update Wrangler (Recommended)

```bash
npm update -g wrangler
```

Then try again:
```bash
wrangler login
```

### Option 2: Use API Token (Alternative)

If OAuth continues to fail, you can use an API token instead:

1. **Create API Token:**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with these permissions:
     - Account: Cloudflare Workers:Edit
     - Account: D1:Edit
     - Account: Workers KV Storage:Edit
     - Zone: Zone Settings:Read (if using custom domains)
   - Copy the token

2. **Set the token:**
   ```bash
   # Windows PowerShell
   $env:CLOUDFLARE_API_TOKEN="your-token-here"
   
   # Or set in environment variables permanently
   [System.Environment]::SetEnvironmentVariable('CLOUDFLARE_API_TOKEN', 'your-token-here', 'User')
   ```

3. **Verify:**
   ```bash
   wrangler whoami
   ```

### Option 3: Clear Wrangler Cache

Sometimes cached auth data causes issues:

```bash
# Clear wrangler config
Remove-Item -Recurse -Force "$env:USERPROFILE\.wrangler" -ErrorAction SilentlyContinue

# Or manually delete:
# C:\Users\YourUsername\.wrangler

# Then try login again
wrangler login
```

### Option 4: Use Wrangler 3.x (If on 4.x)

If you're on wrangler 4.x and having issues, you can try downgrading:

```bash
npm install -g wrangler@3
wrangler login
```

---

## Recommended: Use API Token

For production/CI/CD, API tokens are more reliable than OAuth:

1. Create token at: https://dash.cloudflare.com/profile/api-tokens
2. Set environment variable: `CLOUDFLARE_API_TOKEN`
3. Verify with: `wrangler whoami`

This avoids OAuth browser issues entirely.
