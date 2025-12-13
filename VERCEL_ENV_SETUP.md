# Vercel Environment Variable Setup

## ✅ Step 1: Database Initialized
The remote database schema has been successfully initialized!

## 🔧 Step 2: Set Environment Variable in Vercel

You have two options:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **kasparex-connect-wallet** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `NEXT_PUBLIC_KASPAREX_API_URL`
   - **Value**: `https://kasparex-api.kasparexcom.workers.dev`
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project (or wait for next deployment)

### Option B: Via Vercel CLI

1. Authenticate with Vercel:
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate.

2. Set the environment variable:
   ```bash
   cd kasparex-connect-wallet
   vercel env add NEXT_PUBLIC_KASPAREX_API_URL production
   # When prompted, enter: https://kasparex-api.kasparexcom.workers.dev
   
   vercel env add NEXT_PUBLIC_KASPAREX_API_URL preview
   # When prompted, enter: https://kasparex-api.kasparexcom.workers.dev
   
   vercel env add NEXT_PUBLIC_KASPAREX_API_URL development
   # When prompted, enter: https://kasparex-api.kasparexcom.workers.dev
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

## 🧪 Step 3: Test Locally (Optional)

For local development, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

The file is already configured with the correct API URL.

## ✅ Step 4: Verify Deployment

After setting the environment variable and redeploying:

1. Check your Vercel deployment URL
2. Open browser console (F12)
3. Look for API calls to `kasparex-api.kasparexcom.workers.dev`
4. Verify no CORS errors
5. Test asset resolution (should use Krex Nodes)

## 📝 Current Status

- ✅ Cloudflare Workers deployed
- ✅ Database schema initialized
- ✅ API endpoints working
- ⏳ Vercel environment variable (set this now)
- ⏳ Vercel deployment (after env var is set)

## 🔗 Important URLs

- **Worker API**: https://kasparex-api.kasparexcom.workers.dev
- **Health Check**: https://kasparex-api.kasparexcom.workers.dev/health
- **Stats**: https://kasparex-api.kasparexcom.workers.dev/kasparex/stats


