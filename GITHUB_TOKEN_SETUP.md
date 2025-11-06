# GitHub Token Setup for Timeline Updates

## Why This Is Needed

Vercel serverless functions have a read-only file system, so we can't directly write to files. Instead, the timeline uses the GitHub API to update the `data/updates.json` file in your repository.

## Setup Instructions

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a name: `Vercel Timeline Updates`
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click **Generate token**
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Add Token to Vercel

1. Go to your Vercel Dashboard
2. Select your project: `kasparex-dapp-marketplace`
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Paste your token from Step 1
   - **Environments**: Production, Preview, Development
5. Click **Save**

### Step 3: (Optional) Set Repository Details

If your repository is in a different organization or has a different name, also add:

- **Name**: `GITHUB_REPO_OWNER`
  - **Value**: Your GitHub username or organization (default: `Kasparex`)
- **Name**: `GITHUB_REPO_NAME`
  - **Value**: Your repository name (default: `kasparex-dapp-marketplace`)

### Step 4: Redeploy

After adding the environment variable, trigger a new deployment:
- Go to **Deployments** tab
- Click **"..."** on the latest deployment
- Select **"Redeploy"**

## Testing

1. Go to `/updates` page
2. Click "Add Updates" (or any category)
3. Fill in the form and submit
4. The entry should be added successfully
5. Check your GitHub repository - you should see a new commit updating `data/updates.json`

## Troubleshooting

### "Update may not persist" warning

This means `GITHUB_TOKEN` is not set. Follow Step 2 above.

### "Invalid token" error

- Verify the token has the `repo` scope
- Make sure you copied the entire token
- Check that the token hasn't expired

### Updates not appearing in GitHub

- Check the Vercel function logs for errors
- Verify the repository name and owner are correct
- Ensure the token has write access to the repository

## Security Notes

- The token is stored securely in Vercel environment variables
- It's only used server-side (never exposed to the client)
- You can revoke the token at any time from GitHub settings
- Consider using a fine-grained token with minimal permissions if available

## Alternative: Manual Updates

If you prefer not to set up the token, you can:
- Manually edit `data/updates.json` in GitHub
- Or use the GitHub Action workflow (which already works for deployments)

The GitHub Action will continue to work for automatic deployment tracking even without the token.

