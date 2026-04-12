# 🔐 Secure Environment Variable Setup Guide

## Where to Store Your Private Key

**Use `.env` file** (not `local.env`) in the project root directory.

---

## Step-by-Step Setup

### 1. Create `.env` File

Create a new file named `.env` in the project root (same directory as `package.json`):

```bash
# In the project root directory
touch .env
```

Or on Windows PowerShell:
```powershell
New-Item -Path .env -ItemType File
```

### 2. Add Your Private Key

Open `.env` in a text editor and add:

```env
# Deployer Wallet Private Key (for contract deployment)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Network RPC URL (already configured, but you can override)
IGRA_GALLEON_TESTNET_RPC=https://galleon-testnet.igralabs.com:8545
```

**Important Notes:**
- ✅ **DO** include the private key without the `0x` prefix (or with it - both work)
- ✅ **DO** keep this file local and never commit it to git
- ❌ **DON'T** share this file or its contents
- ❌ **DON'T** commit it to version control

### 3. Verify `.env` is in `.gitignore`

The `.env` file should already be ignored by git. Verify by checking `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env
```

If it returns the path, it's properly ignored. If not, we need to add it.

---

## Where to Get Your Private Key

### Option 1: From MetaMask (or similar wallet)

1. Open MetaMask extension
2. Click the account menu (three dots)
3. Select "Account Details"
4. Click "Show Private Key"
5. Enter your password
6. Copy the private key (it will start with `0x`)

### Option 2: From Hardhat/Other Development Tools

If you're using a development wallet, the private key should be in your wallet configuration.

### Option 3: Create a New Test Wallet (Recommended for Testnet)

For testnet deployment, you can create a new wallet just for testing:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then import this private key into MetaMask and fund it with testnet KAS.

---

## Security Best Practices

### ✅ DO:
- ✅ Use `.env` file (standard practice)
- ✅ Keep `.env` in `.gitignore` (already configured)
- ✅ Use a separate wallet for testnet deployments
- ✅ Never share your private key
- ✅ Use environment-specific keys (different for testnet vs mainnet)

### ❌ DON'T:
- ❌ Commit `.env` to git
- ❌ Share your private key in chat/email
- ❌ Use your main wallet's private key for testing
- ❌ Store private keys in code files
- ❌ Upload `.env` to cloud storage (unless encrypted)

---

## Verify Setup

After creating `.env`, test that it's working:

```bash
# This should show your deployer address (if PRIVATE_KEY is set)
npm run hardhat:deploy:promo-router
```

If you see an address instead of an error, it's working! ✅

---

## Example `.env` File Structure

Here's what your `.env` file should look like (with your actual values):

```env
# ============================================
# WALLET CONFIGURATION
# ============================================
PRIVATE_KEY=abc123def456...your_private_key_here

# ============================================
# NETWORK RPC URLs (optional - defaults work)
# ============================================
IGRA_GALLEON_TESTNET_RPC=https://galleon-testnet.igralabs.com:8545

# ============================================
# TOKEN REGISTRATION (for Step 6)
# ============================================
# Add these later when registering your first token:
# PROMO_MINT_ROUTER_ADDRESS=0x... # From Step 1 deployment
# TOKEN_ADDRESS=0x... # Your DAppToken contract
# TOKEN_ID=your-token-slug
# TOKEN_TICKER=TOKEN
# TOKEN_NAME=Your Token Name
# MINT_PRICE=0.1
# TOKENS_PER_MINT=1000
# MINTABLE_SUPPLY=10000000
# CREATOR_WALLET=0x...
# PLATFORM_WALLET=0x...
# GENESIS_SLOT1=0x...
# GENESIS_SLOT2=0x...
# GENESIS_SLOT3=0x...
# GENESIS_SLOT4=0x...
# GENESIS_SLOT5=0x...
# KASPAREX_API_URL=https://kasparex-api.kasparexcom.workers.dev
# ADMIN_AUTH_TOKEN=your-admin-token-from-step-4
```

---

## Troubleshooting

### "Cannot read properties of undefined (reading 'address')"
- **Solution:** Make sure `PRIVATE_KEY` is set in `.env` and the file is in the project root

### "Invalid private key"
- **Solution:** Check that your private key is correct (64 hex characters, with or without `0x` prefix)

### ".env file not found"
- **Solution:** Make sure the file is named exactly `.env` (with the dot) in the project root directory

---

## Next Steps

Once your `.env` file is set up with `PRIVATE_KEY`:

1. ✅ Verify it's working: `npm run hardhat:deploy:promo-router`
2. ✅ Proceed to Step 1 in `POST_DEPLOYMENT_SETUP.md`
3. ✅ Deploy the contract and get the address
4. ✅ Continue with the remaining setup steps

---

**Ready? Create your `.env` file now!** 🔐
