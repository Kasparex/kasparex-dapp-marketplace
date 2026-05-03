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

After creating `.env`, confirm Hardhat sees your key:

```bash
npm run hardhat:compile
```

---

## Example `.env` File Structure

```env
# ============================================
# WALLET CONFIGURATION
# ============================================
PRIVATE_KEY=abc123def456...your_private_key_here

# ============================================
# NETWORK RPC URLs (optional - defaults work)
# ============================================
IGRA_GALLEON_TESTNET_RPC=https://galleon-testnet.igralabs.com:8545
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

## Production subdomains (Vercel + Wix DNS)

One Next.js app on Vercel; each **subdomain** is a **custom domain** on the same project. Middleware rewrites **`/`** on that host to the section path below (same as opening `https://<project>.vercel.app<path>`).

**Per domain:** Vercel → **Domains** → add `subdomain.kasparex.com` → Wix **CNAME** host = subdomain label, value = Vercel’s target (**omit the trailing dot** in Wix if the UI rejects it). Vercel issues **SSL per domain** when DNS validates; add domains whenever you like - certs generate independently.

| Host (default) | Rewrites `/` to | Optional env override |
|----------------|-----------------|----------------------|
| `dapps.kasparex.com` | `/` (home) | `NEXT_PUBLIC_DAPPS_DOMAIN` |
| `hub.kasparex.com` | `/hub` | `NEXT_PUBLIC_HUB_DOMAIN` |
| `games.kasparex.com` | `/games` | `NEXT_PUBLIC_GAMES_DOMAIN` |
| `vblog.kasparex.com` | `/vblog` | `NEXT_PUBLIC_VBLOG_DOMAIN` |
| `store.kasparex.com` | `/store` | `NEXT_PUBLIC_STORE_DOMAIN` |
| `nodes.kasparex.com` | `/nodes` | `NEXT_PUBLIC_NODES_DOMAIN` |
| `magazines.kasparex.com` | `/magazines` | `NEXT_PUBLIC_MAGAZINES_DOMAIN` |
| `nft.kasparex.com` | `/nft` | `NEXT_PUBLIC_NFT_DOMAIN` |
| `crowdkas.kasparex.com` | `/donations` | `NEXT_PUBLIC_CROWDKAS_DOMAIN` |
| `tokens.kasparex.com` | `/tokens` | `NEXT_PUBLIC_TOKENS_DOMAIN` |
| `studio.kasparex.com` | `/studio` | `NEXT_PUBLIC_STUDIO_DOMAIN` |
| `defi.kasparex.com` | `/defi/swaps` | `NEXT_PUBLIC_DEFI_DOMAIN` |
| `tree.kasparex.com` | `/tree` | `NEXT_PUBLIC_TREE_DOMAIN` |
| `ads.kasparex.com` | `/ads` | `NEXT_PUBLIC_ADS_DOMAIN` |
| `chronicles.kasparex.com` | `/chronicles` | `NEXT_PUBLIC_CHRONICLES_DOMAIN` |
| `dao.kasparex.com` | `/dapps/dao-voting` | `NEXT_PUBLIC_DAO_DOMAIN` |
| `api.kasparex.com` | `/api` (API docs page) | `NEXT_PUBLIC_API_DOMAIN` |
| `docs.kasparex.com` | `/knowledge-base` | `NEXT_PUBLIC_DOCS_DOMAIN` |

`www.kasparex.com` / marketing stays on **Wix** (`NEXT_PUBLIC_LEGACY_DOMAIN`); do not point it at this Vercel app unless you intend to migrate the marketing site.

---

## Next Steps

Once your `.env` file is set up with `PRIVATE_KEY`, use the Hardhat scripts in `package.json` for the contracts you deploy (e.g. Revenue Tree, donations, genesis badge).

---

**Ready? Create your `.env` file now!** 🔐
