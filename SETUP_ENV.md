# Setting Up Environment Variables

This guide will walk you through setting up environment variables for the Kasparex dApps marketplace.

## Required Environment Variables

1. **KAS_FYI_API_KEY** - API key for kas.fyi (Kaspa Developer Platform)
2. **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID** - WalletConnect Project ID (optional but recommended)

---

## Setting Up Kas.fyi API Key

### Step 1: Get Your API Key

1. **Visit Kaspa Developer Platform**
   - Go to [https://developer.kas.fyi/](https://developer.kas.fyi/)
   - Or visit [https://docs.kas.fyi/](https://docs.kas.fyi/)

2. **Sign In or Create Account**
   - Sign in with your account
   - If you don't have an account, create one

3. **Get Your API Key**
   - Navigate to API keys section
   - Copy your API key (starts with `kdp_`)

### Step 2: Add to .env.local

Add this line to your `.env.local` file:

```env
KAS_FYI_API_KEY=kdp_your_api_key_here
```

**Important**: This key is used **server-side only** and is never exposed to the client.

---

## Setting Up WalletConnect Project ID

This guide will walk you through getting and setting up your WalletConnect Project ID.

## Step 1: Get Your WalletConnect Project ID

1. **Visit Reown Dashboard** (formerly WalletConnect Cloud)
   - Go to [https://dashboard.reown.com/](https://dashboard.reown.com/)
   - Note: `cloud.walletconnect.com` redirects to Reown dashboard

2. **Sign In or Create Account**
   - Sign in with GitHub, Google, or email
   - If you don't have an account, create one (it's free)

3. **Create a New Project**
   - Click **"Create New Project"** or **"New Project"**
   - Enter project details:
     - **Project Name**: `Kasparex dApps` (or any name you prefer)
     - **Homepage URL**: Your website URL (or `http://localhost:3000` for local development)
     - Click **"Create"**

4. **Copy Your Project ID**
   - After creating the project, you'll see a **Project ID**
   - It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - Copy this ID (you'll need it in the next step)

## Step 2: Create .env.local File

1. **Create the file in your project root**
   - In the root directory of your project (same level as `package.json`)
   - Create a new file named: `.env.local`

2. **Add your environment variables**
   - Open `.env.local` in a text editor
   - Add these lines (replace with your actual values):
   
   ```env
   # Kas.fyi API Key (server-side only)
   KAS_FYI_API_KEY=kdp_your_api_key_here
   
   # WalletConnect Project ID (optional but recommended)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
   ```

   **Example:**
   ```env
   KAS_FYI_API_KEY=kdp_56c6d5e742aebabf6470561ef3ab41d1549097eca4ad0e5fe8402c20e417af29
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. **Save the file**
   - Make sure to save the file

## Step 3: Restart Your Development Server

After creating/updating `.env.local`:

1. **Stop your dev server** (if running)
   - Press `Ctrl+C` in your terminal

2. **Start it again**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   ⚠️ **Important**: Environment variables are loaded when Next.js starts, so you must restart the dev server for changes to take effect.

## Step 4: Verify It Works

1. Open your app in the browser (usually `http://localhost:3000`)
2. Click the **Connect** button in the top-right corner
3. You should see the RainbowKit wallet connection modal with various wallet options

## For Production Deployment

When deploying to **Vercel**, **Netlify**, or other platforms:

1. Go to your project settings on the platform
2. Find **Environment Variables** or **Env Vars** section
3. Add these variables:

### Required Variables:

**KAS_FYI_API_KEY** (Server-side only)
- **Name**: `KAS_FYI_API_KEY`
- **Value**: Your kas.fyi API key (starts with `kdp_`)
- **Environment**: Production, Preview, Development (all environments)
- **Important**: Do NOT use `NEXT_PUBLIC_` prefix - this keeps the key server-side only

**NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID** (Optional but recommended)
- **Name**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Value**: Your WalletConnect Project ID
- **Environment**: Production, Preview, Development (all environments)

4. Redeploy your application

### Vercel Example:
1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New** for each variable:
   
   **For KAS_FYI_API_KEY:**
   - **Key**: `KAS_FYI_API_KEY`
   - **Value**: `kdp_your_api_key_here`
   - **Environment**: Production, Preview, Development
   - Click **Save**
   
   **For WalletConnect (optional):**
   - **Key**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - **Value**: `your-project-id-here`
   - **Environment**: Production, Preview, Development
   - Click **Save**
4. Go to **Deployments** tab and **Redeploy** your application

## Troubleshooting

### The app still works without the Project ID?
- ✅ That's normal! The app has a fallback (`'default-project-id'`), but it's recommended to use your own Project ID for:
  - Better wallet connection reliability
  - Access to WalletConnect analytics
  - Custom branding (optional)

### Can't find .env.local file?
- Make sure you're in the **root directory** of the project (where `package.json` is)
- The file might be hidden (on Windows/Mac, hidden files start with a dot `.`)
- Some text editors might not show hidden files by default

### Changes not taking effect?
- Make sure you **restarted your dev server** after creating/editing `.env.local`
- Check for typos in the variable name: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Make sure there are **no spaces** around the `=` sign
- Make sure the file is saved

## File Structure

Your project should look like this:

```
kasparex-connect-wallet/
├── .env.local          ← Create this file here (root directory)
├── package.json
├── src/
├── public/
└── ...
```

## Security Notes

✅ **Good**: The `.env.local` file is already in `.gitignore`, so it won't be committed to your repository.

✅ **API Key Security**: The `KAS_FYI_API_KEY` is stored server-side only (no `NEXT_PUBLIC_` prefix), so it's never exposed to the browser. All API calls go through secure Next.js API routes.

✅ **WalletConnect Project ID**: The `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is safe to expose to the client (it's a public identifier).

❌ **Never** commit environment variables with sensitive data to your repository!

❌ **Never** use `NEXT_PUBLIC_` prefix for API keys or secrets - they will be exposed to the browser!

