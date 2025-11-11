# Vercel Environment Variables

## Required Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

### 1. Pinata IPFS (Required)
- `NEXT_PUBLIC_PINATA_API_KEY` - Your Pinata API Key
- `NEXT_PUBLIC_PINATA_API_SECRET` - Your Pinata API Secret

### 2. WalletConnect (Recommended)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Your WalletConnect Project ID
  - Get one at: https://cloud.walletconnect.com
  - If not set, will use a default (may have limited functionality)

### 3. Optional - Contract Addresses
These are optional as they have fallback values in the code:
- `NEXT_PUBLIC_TREASURY_ADDRESS`
- `NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_GRID_TOKEN_ADDRESS`
- etc.

## How to Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy the Project ID
5. Add it to Vercel as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## After Adding Variables

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"** to apply the new environment variables

Or push a new commit to trigger automatic redeployment.

