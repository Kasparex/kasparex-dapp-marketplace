# GitBook Git Sync Setup Guide

This guide will help you connect your GitBook space to your GitHub repository for automatic documentation synchronization.

---

## Prerequisites

- Git repository already set up (✅ You have: `https://github.com/Kasparex/kasparex-dapp-marketplace.git`)
- GitBook space created
- Admin access to your GitBook space

---

## Step 1: Enable Git Sync in GitBook

1. **Go to your GitBook space**
   - Navigate to: `https://kasparex.gitbook.io/docs` (or your space URL)
   - Click on **Space Settings** (gear icon)

2. **Enable Git Sync**
   - Go to **"Integrations"** or **"Git Sync"** section
   - Click **"Connect Git Repository"** or **"Enable Git Sync"**
   - Select **GitHub** as your Git provider

3. **Authorize GitBook**
   - Click **"Authorize GitBook"** to connect your GitHub account
   - Grant GitBook access to your repository

4. **Select Repository**
   - Choose: `Kasparex/kasparex-dapp-marketplace`
   - Select branch: `main` (or your preferred branch)
   - Set the **content path**: `/gitbook-docs` (this tells GitBook where your docs are)

5. **Configure Sync Settings**
   - **Sync direction**: Choose "GitBook → Git" or "Git → GitBook" or "Bidirectional"
   - For automatic updates, choose **"Git → GitBook"** (recommended)
   - This means when you push to GitHub, GitBook will automatically update

6. **Save Settings**
   - Click **"Save"** or **"Enable Sync"**
   - GitBook will perform an initial sync

---

## Step 2: Commit Generated Documentation

The documentation files are generated in `gitbook-docs/`. You need to commit and push them:

```bash
# Add the generated documentation
git add gitbook-docs/
git add scripts/gitbook-sync/
git add templates/gitbook/
git add src/lib/gitbook/
git add docs/GITBOOK_SETUP.md
git add docs/GITBOOK_GIT_SYNC.md
git add package.json

# Commit
git commit -m "Add GitBook documentation sync system and generated docs"

# Push to GitHub
git push origin main
```

---

## Step 3: Verify Sync

1. **Check GitBook**
   - Go to your GitBook space
   - You should see the documentation pages appear automatically
   - Check the "Git Sync" section in settings to see sync status

2. **Check GitHub**
   - Verify files are in `gitbook-docs/` directory
   - GitBook should show a sync status indicator

---

## Step 4: Automated Workflow

### Option A: Manual Sync (Current)

When you update dApps or want to regenerate docs:

```bash
# 1. Generate updated documentation
npm run gitbook:generate

# 2. Commit and push
git add gitbook-docs/
git commit -m "Update GitBook documentation"
git push origin main

# GitBook will automatically sync within a few minutes
```

### Option B: Automated Script

Use the provided script:

```bash
npm run gitbook:sync:git
```

This will:
1. Generate fresh documentation
2. Commit changes
3. Push to GitHub
4. GitBook will auto-sync

---

## GitBook Directory Structure

GitBook expects markdown files in a specific structure. The generated files follow this pattern:

```
gitbook-docs/
├── README.md                    # Index/landing page
├── dapps/
│   ├── subscription-checker.md
│   ├── quiz-to-earn.md
│   └── ...
└── integration/
    ├── subscription-checker.md
    ├── quiz-to-earn.md
    └── ...
```

GitBook will automatically organize these into pages based on the directory structure.

---

## Troubleshooting

### Git Sync Not Working

1. **Check Git Sync Status**
   - Go to GitBook Space Settings → Git Sync
   - Look for error messages or sync status

2. **Verify Repository Access**
   - Ensure GitBook has access to your GitHub repository
   - Check repository permissions in GitHub settings

3. **Check Content Path**
   - Verify the content path is set to `/gitbook-docs`
   - GitBook needs to know where your markdown files are

4. **Manual Trigger**
   - In Git Sync settings, try clicking "Sync Now" or "Trigger Sync"

### Files Not Appearing in GitBook

1. **Check File Format**
   - Ensure files are `.md` (markdown)
   - Check that files are in the correct directory

2. **Check GitBook Structure**
   - GitBook may need a `SUMMARY.md` or `structure.json` file
   - See "Creating GitBook Structure" section below

3. **Wait for Sync**
   - Git sync can take a few minutes
   - Check sync status in GitBook settings

---

## Creating GitBook Structure File

GitBook can use a `SUMMARY.md` file to define the page structure. Create this file:

```markdown
# Summary

* [Introduction](README.md)
* [dApps](dapps/README.md)
  * [Subscription Checker](dapps/subscription-checker.md)
  * [Quiz to Earn](dapps/quiz-to-earn.md)
  * ...
* [Integration Guides](integration/README.md)
  * [Subscription Checker Integration](integration/subscription-checker.md)
  * ...
```

Place this in `gitbook-docs/SUMMARY.md` and GitBook will use it to organize pages.

---

## Best Practices

1. **Regular Updates**
   - Regenerate docs when dApps are added/updated
   - Commit and push regularly

2. **Version Control**
   - Use meaningful commit messages
   - Tag releases if needed

3. **Review Before Pushing**
   - Check generated markdown files before committing
   - Ensure formatting looks good

4. **Backup**
   - GitBook syncs from Git, so your docs are backed up in GitHub
   - Consider keeping local copies too

---

## Next Steps

1. ✅ Enable Git Sync in GitBook
2. ✅ Commit and push generated documentation
3. ✅ Verify sync is working
4. ✅ Set up automated workflow (optional)

---

*For more information, see:*
- [GitBook Git Sync Documentation](https://docs.gitbook.com/integrations/git-sync)
- [GitBook Content Structure](https://docs.gitbook.com/content-editor/content-structure)

