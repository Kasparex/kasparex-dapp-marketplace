# Automatic Deployment Tracking via GitHub Actions

## Overview

The timeline page now automatically tracks deployments using **GitHub Actions** (completely free!). Each time you push to the `main` branch, a new entry is automatically added to the timeline.

## How It Works

1. **You push code to GitHub** → Triggers GitHub Action
2. **GitHub Action runs** → Extracts commit information
3. **Updates timeline** → Adds entry to `data/updates.json`
4. **Commits back** → The updated timeline is committed to the repo
5. **Vercel deploys** → Your site updates with the new timeline entry

## Setup

**No setup required!** The GitHub Action is already configured and will work automatically.

The workflow file is located at: `.github/workflows/track-deployments.yml`

## What Gets Tracked

Each deployment entry includes:
- **Title**: "Deployment to [branch name]"
- **Description**: Commit message and author
- **Date**: Commit timestamp
- **Type**: "deployment"
- **ID**: Unique identifier based on commit SHA

## Example Timeline Entry

```json
{
  "id": "deploy-1234567890-abc1234",
  "title": "Deployment to main",
  "description": "Website deployed successfully. Commit: Add new feature (by John Doe)",
  "date": "2024-01-15T10:30:00Z",
  "type": "deployment"
}
```

## How to Test

1. Make a small change to any file
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Test deployment tracking"
   git push origin main
   ```
3. Wait a few minutes for:
   - GitHub Action to run
   - Timeline to update
   - Vercel to deploy
4. Check `/updates` page - you should see the new entry!

## Viewing Action Logs

To see if the action is working:
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Look for "Track Deployments" workflow
4. Click on a run to see logs

## Manual Entries

You can still manually add entries for:
- Tasks to Do
- Potential Ideas
- Bug Fixes
- Other updates that aren't deployments

Use the "Add" buttons on the timeline page to create manual entries.

## Troubleshooting

### No entries appearing

1. **Check GitHub Actions**: Go to Actions tab and verify the workflow is running
2. **Check workflow file**: Ensure `.github/workflows/track-deployments.yml` exists
3. **Check permissions**: The workflow needs `contents: write` permission (already configured)
4. **Check file**: Verify `data/updates.json` exists and is being updated

### Duplicate entries

The workflow checks for existing entries based on commit SHA, so duplicates should be prevented. If you see duplicates, they might be from different branches or commits.

### Workflow not running

- Ensure you're pushing to the `main` branch (or update the workflow to track other branches)
- Check that the workflow file is in `.github/workflows/` directory
- Verify the file is committed to the repository

## Advantages of This Approach

✅ **Completely Free** - No Vercel Pro plan needed  
✅ **Automatic** - Works on every push  
✅ **Reliable** - Uses GitHub's infrastructure  
✅ **Transparent** - You can see the action logs  
✅ **Version Controlled** - Timeline changes are in git history  

## Customization

To customize what gets tracked, edit `.github/workflows/track-deployments.yml`:

- Change branch: Update `branches: - main` to track other branches
- Change entry format: Modify the `NEW_ENTRY` JSON structure
- Add filters: Only track commits with specific patterns in commit messages

## Next Steps

Just start pushing to `main` and your deployments will be automatically tracked! 🚀

