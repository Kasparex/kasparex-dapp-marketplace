# ⚠️ IMPORTANT: Vercel Environment Variables Check

## The Error You're Seeing

The error `Cannot read properties of undefined (reading 'kasplexL2Mainnet')` means that the environment variables are **NOT set in Vercel**.

## Solution: Add Environment Variables to Vercel

You MUST add these environment variables to your Vercel project:

### Steps:

1. Go to your Vercel Dashboard: https://vercel.com
2. Select your project: `kasparex-dapp-marketplace`
3. Go to **Settings** → **Environment Variables**
4. Add these variables (one by one):

```
NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET=0x305B4ee627aD8b12bFCF6427453964771aA30622
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET=0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET=0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET=0xaC941a612b30Fe15F84a961a1FaCF2Ea5c2ef21E
NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET=0x0530c962A17fB4602418087689e762e5989f1D43
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET=0x0F405c342e9596621430C5f888D673d40111a0ac
```

5. **IMPORTANT**: After adding each variable, make sure to:
   - Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

6. **After adding all variables**, trigger a new deployment:
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**

## Why This Is Required

Next.js requires environment variables that start with `NEXT_PUBLIC_` to be set at **build time** in Vercel. Without these variables, the contract addresses will be empty strings, causing the app to fail.

## Verification

After adding the variables and redeploying, check:
1. The build logs should show no errors
2. The app should load without the white screen
3. The Simple Payment dApp should display the widget

## Quick Copy-Paste for Vercel

Copy this entire block and add each line as a separate environment variable in Vercel:

```
NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET=0x305B4ee627aD8b12bFCF6427453964771aA30622
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET=0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET=0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET=0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET=0xaC941a612b30Fe15F84a961a1FaCF2Ea5c2ef21E
NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET=0x0530c962A17fB4602418087689e762e5989f1D43
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET=0x0F405c342e9596621430C5f888D673d40111a0ac
```

