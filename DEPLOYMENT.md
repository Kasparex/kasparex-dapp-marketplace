# Deployment Guide

## Quick Deploy to Vercel (Recommended - 2 minutes)

Vercel is the easiest way to deploy Next.js apps:

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Kaspa dApp Marketplace"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up" or "Log in" (you can use GitHub to sign in)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variable:
     - Name: `NEXT_PUBLIC_TEMPLATE_CLIENT_ID`
     - Value: Your thirdweb client ID
   - Click "Deploy"

3. **Your site will be live in ~2 minutes!**

## Alternative: Deploy to GitHub Pages (More Complex)

For GitHub Pages, you need to:
1. Build the app as a static site
2. Configure Next.js for static export
3. Use GitHub Actions

This is more complex - Vercel is recommended for Next.js.

## Environment Variables

Make sure to set this in your deployment platform:
- `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` - Your thirdweb client ID

## Build Locally First (Optional)

To test the production build:

```bash
npm run build
npm start
```

Then visit `http://localhost:3000`

