# Admin Setup Guide

## What is NEXT_PUBLIC_ADMIN_ADDRESSES?

`NEXT_PUBLIC_ADMIN_ADDRESSES` is an environment variable that stores your admin wallet address(es). This allows you (and only you) to access the admin dashboard at `/admin` where you can:

- Assign developers to dApps
- Manage global fee settings (Treasury distribution percentages)
- Configure per-dApp subscription fees
- Update revenue distribution addresses

**Important:** This is a frontend check for UI access. The actual authorization for on-chain actions is controlled by the smart contract's `DEFAULT_ADMIN_ROLE`.

## Format

The variable accepts **comma-separated wallet addresses** (Ethereum format: `0x...`).

**Single admin:**
```
NEXT_PUBLIC_ADMIN_ADDRESSES=0x1234567890123456789012345678901234567890
```

**Multiple admins:**
```
NEXT_PUBLIC_ADMIN_ADDRESSES=0x1234567890123456789012345678901234567890,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

**Note:** Addresses are case-insensitive and will be automatically normalized.

## How to Set It

### Method 1: Local Development (.env.local)

1. **Create `.env.local` file** in your project root (same folder as `package.json`)

2. **Add your admin address:**
   ```bash
   NEXT_PUBLIC_ADMIN_ADDRESSES=0xYourWalletAddressHere
   ```

3. **Example:**
   ```bash
   NEXT_PUBLIC_ADMIN_ADDRESSES=0x0808e5ce2f0f6d488975e5f23f1a1c8b6dd53cbc
   ```

4. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

**Why `.env.local`?**
- It's already in `.gitignore` (won't be committed to Git)
- Next.js automatically loads it
- `NEXT_PUBLIC_` prefix makes it available in the browser

### Method 2: Production (Vercel)

If you're deploying to Vercel:

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Select your project

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add the variable:**
   - Click **Add New**
   - **Name:** `NEXT_PUBLIC_ADMIN_ADDRESSES`
   - **Value:** Your wallet address (e.g., `0x0808e5ce2f0f6d488975e5f23f1a1c8b6dd53cbc`)
   - **Environments:** Select where it applies:
     - ✅ Production
     - ✅ Preview (optional)
     - ✅ Development (optional)

4. **Save and Redeploy:**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Select **"Redeploy"**

### Method 3: Other Hosting Platforms

For other platforms (Netlify, Railway, etc.), add the environment variable in their dashboard settings following the same format.

## How to Find Your Wallet Address

### If using MetaMask/Rabby/Other EVM Wallet:

1. Open your wallet extension
2. Connect to the network (Kasplex L2 Testnet or Mainnet)
3. Click on your account name/icon
4. Copy the address (it starts with `0x`)

### If using KasWare:

1. Connect your KasWare wallet
2. The address will be shown in the wallet interface
3. Copy it (it may have `kaspa:` prefix - that's fine, the code handles it)

## Verification

After setting the variable:

1. **Restart your dev server** (if local)
2. **Connect your wallet** to the website
3. **Look for the admin icon** in the header (lock icon with blue dot)
4. **Visit `/admin`** - you should see the admin dashboard
5. **If you see "Access Denied"** - check:
   - Is the address correct? (no typos)
   - Did you restart the server?
   - Is your wallet connected with the correct address?

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.local` to Git** - it's already in `.gitignore`
2. **Use different addresses for testnet/mainnet** if needed
3. **The environment variable is public** (because of `NEXT_PUBLIC_` prefix) - this is intentional for frontend checks
4. **Real security is on-chain** - The smart contract's `DEFAULT_ADMIN_ROLE` is what actually controls permissions
5. **Multiple admins** - You can add multiple addresses separated by commas

## Troubleshooting

### "Access Denied" even with correct address

- Check for extra spaces in the address
- Ensure the address is in correct format (`0x` followed by 40 hex characters)
- Verify you're connected with the exact same address
- Restart the development server

### Admin icon not showing

- Check browser console for errors
- Verify the environment variable is loaded: `console.log(process.env.NEXT_PUBLIC_ADMIN_ADDRESSES)`
- Make sure you're using `NEXT_PUBLIC_` prefix (required for client-side access)

### Multiple addresses not working

- Ensure addresses are separated by commas (no spaces around commas)
- Example: `0x123...,0x456...` (correct)
- Example: `0x123... , 0x456...` (will work, but avoid spaces)

## Example .env.local File

```bash
# Admin wallet addresses (comma-separated)
NEXT_PUBLIC_ADMIN_ADDRESSES=0x0808e5ce2f0f6d488975e5f23f1a1c8b6dd53cbc

# Other environment variables (if you have them)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## What Happens Behind the Scenes

1. **Frontend Check:** When you connect your wallet, the code checks if your address is in `NEXT_PUBLIC_ADMIN_ADDRESSES`
2. **UI Access:** If yes, you see the admin link in the header and can access `/admin`
3. **On-Chain Check:** When you perform actions (assign developer, update fees), the smart contract verifies you have `DEFAULT_ADMIN_ROLE`
4. **Double Security:** Both checks must pass for full admin functionality

This dual-layer approach ensures:
- Frontend: Quick UI access control
- On-chain: Real authorization that can't be bypassed

