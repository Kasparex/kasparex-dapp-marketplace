# Setting Up Environment Variables in Vercel

This guide will walk you through adding your WalletConnect Project ID to Vercel for deployment.

## Step-by-Step Instructions

### 1. Access Your Vercel Project

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Sign in to your Vercel account
3. Find your **Kasparex dApps** project (or the project name you used)
4. Click on the project to open it

### 2. Navigate to Environment Variables

1. In your project dashboard, click on the **Settings** tab (top navigation)
2. In the left sidebar, click on **Environment Variables**
3. You'll see a section to add new environment variables

### 3. Add Your WalletConnect Project ID

1. Click the **Add New** button (or **Add Environment Variable**)
2. Fill in the form:
   - **Key**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - **Value**: Paste your Project ID from Reown dashboard (the one you created)
   - **Environment**: Select all three options:
     - ✅ **Production** (for your live site)
     - ✅ **Preview** (for preview deployments)
     - ✅ **Development** (for development deployments)
3. Click **Save**

### 4. Redeploy Your Application

After adding the environment variable, you need to trigger a new deployment:

**Option A: Automatic Redeploy (if auto-deploy is enabled)**
- If your GitHub repo has auto-deploy enabled, Vercel will automatically deploy when you push changes
- Since we just pushed, you can wait for it to redeploy automatically
- Go to the **Deployments** tab to see the status

**Option B: Manual Redeploy**
1. Go to the **Deployments** tab
2. Find the latest deployment
3. Click the **•••** (three dots) menu next to it
4. Click **Redeploy**
5. Confirm the redeployment

### 5. Verify It Works

1. Once deployment completes, visit your live site
2. Click the **Connect** button
3. You should see the RainbowKit wallet connection modal working properly

## Quick Reference

- **Environment Variable Name**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Where to get the value**: [Reown Dashboard](https://dashboard.reown.com/)
- **When to set**: Before or after deployment (then redeploy)

## Important Notes

✅ **All Environments**: Make sure to select Production, Preview, and Development when adding the variable

✅ **Next.js Prefix**: The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser

✅ **No Spaces**: Make sure there are no spaces around the `=` sign or in the Project ID value

✅ **Redeploy Required**: After adding/changing environment variables, you must redeploy for changes to take effect

## Troubleshooting

### Changes not taking effect?
- Make sure you **redeployed** after adding the variable
- Check that you selected all environments (Production, Preview, Development)
- Verify the variable name is exactly: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Check the deployment logs in Vercel to see if there are any errors

### Can't find the Settings tab?
- Make sure you're logged into the correct Vercel account
- Verify you have access/permissions to the project
- Try refreshing the page

### Project ID not working?
- Double-check you copied the entire Project ID (no extra spaces)
- Verify the Project ID is correct in the Reown dashboard
- Make sure the project is active in Reown dashboard

