# Quick Guide: Setting Up GitHub Token

## Why You Need This

When you add entries via the "Add Entry" button, they need to be saved to GitHub. Without the token, entries are added but don't persist.

## Step-by-Step Setup (5 minutes)

### 1. Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `Vercel Timeline Updates`
4. Check the box: ✅ **repo** (Full control of private repositories)
5. Scroll down and click **"Generate token"**
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click on your project: **kasparex-dapp-marketplace**
3. Go to: **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Paste your token from step 1
   - **Environments**: Check all three (Production, Preview, Development)
6. Click **"Save"**

### 3. Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to finish (~2 minutes)

### 4. Test It!

1. Go to `/updates` page
2. Click **"Add Updates"** (or any category)
3. Fill in the form and click **"Add Entry"**
4. The entry should appear immediately in the timeline!
5. Check your GitHub repo - you should see a new commit updating `data/updates.json`

## Troubleshooting

**Entries still not showing?**
- Make sure you redeployed after adding the token
- Check Vercel function logs for errors
- Verify the token has `repo` scope

**"Invalid token" error?**
- Make sure you copied the entire token (starts with `ghp_`)
- Verify the token hasn't expired
- Check that `repo` scope is selected

**Need help?**
- Check the full guide: `GITHUB_TOKEN_SETUP.md`
- Or manually edit `data/updates.json` in GitHub

