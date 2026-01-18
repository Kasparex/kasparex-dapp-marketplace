# Update API Token Permissions

## Issue
Your API token is authenticated but missing D1 database permissions.

## Solution

1. **Go to API Tokens:**
   https://dash.cloudflare.com/profile/api-tokens

2. **Find your token** (the one ending in `...0e-`)

3. **Edit the token** and add these permissions:
   - ✅ Account: **D1:Edit** (required for creating databases)
   - ✅ Account: Cloudflare Workers:Edit (already have)
   - ✅ Account: Workers KV Storage:Edit (already have)

4. **Save** the updated token

5. **Use the same token** - the token value doesn't change, just the permissions

## Alternative: Create New Token

If you can't edit the existing token:

1. **Create a new token** with these permissions:
   - Account: Cloudflare Workers:Edit
   - Account: D1:Edit
   - Account: Workers KV Storage:Edit
   - Account: Account Settings:Read

2. **Replace the token** in your environment variable

3. **Continue with setup**
