# GitBook API Setup Guide

Step-by-step instructions for setting up GitBook API integration with the Kasparex dApp Marketplace.

---

## Prerequisites

- A GitBook account (sign up at [gitbook.com](https://www.gitbook.com))
- Access to your GitBook space (the documentation space you want to sync to)
- Node.js installed (for running sync scripts)

---

## Step 1: Create a GitBook Account

If you don't have a GitBook account:

1. Visit [gitbook.com](https://www.gitbook.com)
2. Click "Sign Up" and create your account
3. Verify your email address

---

## Step 2: Access Your GitBook Space

1. Log in to GitBook
2. Navigate to your space (e.g., `https://kasparex.gitbook.io/docs`)
3. Note the space URL - you'll need the Space ID from it

---

## Step 3: Get Your Space ID

The Space ID can be found in your GitBook space URL:

- **Format**: `https://[organization].gitbook.io/[space-name]`
- **Example**: `https://kasparex.gitbook.io/docs`
  - Organization: `kasparex`
  - Space: `docs`

For the API, you typically need:
- **Space ID**: Usually the space name (e.g., `docs`) or can be found in space settings
- **Organization ID**: Your organization name (e.g., `kasparex`)

**To find exact IDs:**
1. Go to your GitBook space
2. Click on space settings (gear icon)
3. Look for "Space ID" in the settings
4. For Organization ID, check your organization settings

---

## Step 4: Create an API Token

1. Go to your GitBook account settings:
   - Click your profile picture → Settings
   - Or visit: `https://app.gitbook.com/settings`

2. Navigate to **"Developers"** or **"API"** section

3. Click **"Create new token"** or **"Generate token"**

4. Provide a name for your token (e.g., "Kasparex dApp Sync")

5. Select the necessary scopes/permissions:
   - `content:write` - To create and update pages
   - `content:read` - To read existing pages
   - `space:read` - To access space information

6. Click **"Create"** or **"Generate"**

7. **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - Store it securely
   - You'll need it for the sync scripts

---

## Step 5: Configure Environment Variables

### Option A: Using .env.local (Recommended)

1. Create or edit `.env.local` in your project root:

```env
# GitBook API Configuration
GITBOOK_API_TOKEN=your_api_token_here
GITBOOK_SPACE_ID=your_space_id_here
GITBOOK_ORGANIZATION_ID=your_organization_id_here  # Optional
```

2. Replace the placeholder values with your actual credentials

### Option B: Using Interactive Setup

Run the setup command:

```bash
npm run gitbook:setup
```

This will prompt you for your credentials and save them to `.env.local`.

---

## Step 6: Test the Connection

Test your GitBook API connection:

```bash
npm run gitbook:test
```

You should see:
```
✅ Connected to GitBook API
✅ Connection test successful!
```

If you see an error, check:
- Your API token is correct
- Your Space ID is correct
- You have the necessary permissions
- Your internet connection is working

---

## Step 7: Sync Documentation

Once configured, you can sync documentation:

### Sync All dApps

```bash
npm run gitbook:sync
```

### Sync a Specific dApp

```bash
npm run gitbook:sync -- --dapp "Quiz to Earn"
```

### Sync from Different Network

```bash
npm run gitbook:sync -- --network kasplexL2Mainnet
```

---

## Troubleshooting

### Error: "Failed to connect to GitBook API"

**Possible causes:**
- Invalid API token
- Incorrect Space ID
- Network connectivity issues

**Solutions:**
1. Verify your API token is correct (create a new one if needed)
2. Double-check your Space ID
3. Test your internet connection
4. Check GitBook API status: [status.gitbook.com](https://status.gitbook.com)

### Error: "Unauthorized" or "403 Forbidden"

**Possible causes:**
- Token doesn't have required permissions
- Token has expired
- Space access restrictions

**Solutions:**
1. Create a new token with proper permissions
2. Ensure you have access to the space
3. Check organization/space settings for API access restrictions

### Error: "Space not found" or "404 Not Found"

**Possible causes:**
- Incorrect Space ID
- Space doesn't exist
- Organization ID mismatch

**Solutions:**
1. Verify the Space ID in GitBook settings
2. Check the space URL format
3. Ensure you're using the correct organization ID (if required)

### Pages Not Updating

**Possible causes:**
- GitBook caching
- Page path conflicts
- Content format issues

**Solutions:**
1. Wait a few minutes for GitBook to refresh
2. Check GitBook space directly to see if pages exist
3. Try syncing again with `npm run gitbook:sync`

---

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`
   - Contains sensitive API credentials

2. **Use environment-specific tokens**
   - Create separate tokens for development/production
   - Rotate tokens periodically

3. **Limit token permissions**
   - Only grant necessary scopes
   - Don't use admin-level tokens unless required

4. **Store tokens securely**
   - Use environment variables
   - Consider using secret management tools for production

---

## Additional Resources

- [GitBook API Documentation](https://developer.gitbook.com/)
- [GitBook API Reference](https://developer.gitbook.com/api-reference)
- [GitBook Support](https://support.gitbook.com/)

---

## Next Steps

After setup:
1. Test the connection: `npm run gitbook:test`
2. Sync all dApps: `npm run gitbook:sync`
3. Set up event listener (optional): `npm run gitbook:listen`

---

*Last updated: {{LAST_UPDATED}}*

