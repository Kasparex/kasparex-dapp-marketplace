# How to Get Your Private Key - Step by Step Guide

## ⚠️ SECURITY WARNING

**Private keys give full access to your wallet. Never share them with anyone!**

- Use a **separate wallet** for development/testing
- **Never use your main wallet's private key**
- For testnet, create a new wallet just for testing
- Keep your private key secure and never commit it to git

## Step 1: Choose Your Wallet

### Option A: MetaMask (Recommended for EVM)

1. **Install MetaMask** (if you don't have it)
   - Chrome: https://chrome.google.com/webstore/detail/metamask
   - Firefox: https://addons.mozilla.org/firefox/addon/ether-metamask

2. **Create a New Account** (for testing)
   - Click the account icon (top right)
   - Select "Create Account" or "Add Account"
   - Name it "Kasparex Test" or similar
   - **IMPORTANT**: Use a separate account, not your main wallet!

3. **Get Your Private Key**
   - Click the three dots menu (⋮) next to your account name
   - Select "Account details"
   - Click "Show private key"
   - Enter your MetaMask password
   - Copy the private key (it starts with 0x)

### Option B: Rabby Wallet (Recommended for Multi-Chain)

**Rabby Wallet** is a popular multi-chain wallet that works great with Kasplex L2.

1. **Install Rabby Wallet** (if you don't have it)
   - Chrome: https://chrome.google.com/webstore/detail/rabby/acmacodpbdjkkmoedlahcemfehccpfhp
   - Firefox: https://addons.mozilla.org/firefox/addon/rabby-wallet/

2. **Create a New Account** (for testing)
   - Click the account icon (top right)
   - Select "Add Account" or "Create Account"
   - Name it "Kasparex Test" or similar
   - **IMPORTANT**: Use a separate account, not your main wallet!

3. **Get Your Private Key**
   - Click the account icon (top right)
   - Click on your account name
   - Go to "Account Details" or click the three dots (⋮)
   - Select "Export Private Key" or "Show Private Key"
   - Enter your Rabby password
   - Copy the private key (it starts with 0x)

   **Alternative method:**
   - Click the account icon
   - Select "Manage Accounts"
   - Click on your account
   - Click "Export Private Key"
   - Enter password and copy

### Option C: Other EVM Wallets

#### Trust Wallet
1. Open Trust Wallet
2. Go to Settings → Wallets
3. Select your wallet
4. Tap "Show Recovery Phrase" or "Export Private Key"
5. Copy the private key

#### Coinbase Wallet
1. Open Coinbase Wallet
2. Go to Settings
3. Select "Recovery Phrase" or "Private Key"
4. Authenticate and copy

### Option D: Create a New Wallet Using Hardhat

If you want to generate a fresh wallet just for deployment:

```bash
# Generate a new random private key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a new private key. **Save this securely!**

Then you'll need to:
1. Fund this wallet with testnet KAS tokens
2. Use this private key in your `.env` file

## Step 2: Configure Rabby Wallet for Kasplex L2 (If Using Rabby)

If you're using Rabby wallet, you need to add Kasplex L2 networks:

### Add Kasplex L2 Testnet:
1. Open Rabby Wallet
2. Click the network selector (top center)
3. Click "Add Network" or "Custom RPC"
4. Enter:
   - **Network Name**: Kasplex L2 Testnet
   - **RPC URL**: https://rpc.kasplextest.xyz
   - **Chain ID**: 167012
   - **Currency Symbol**: KAS
   - **Block Explorer**: https://explorer.testnet.kasplextest.xyz

### Add Kasplex L2 Mainnet:
1. Open Rabby Wallet
2. Click the network selector
3. Click "Add Network" or "Custom RPC"
4. Enter:
   - **Network Name**: Kasplex L2 Mainnet
   - **RPC URL**: https://evmrpc.kasplex.org
   - **Chain ID**: 202555
   - **Currency Symbol**: KAS
   - **Block Explorer**: https://explorer.kasplex.org

## Step 3: Get Testnet KAS Tokens

Before deploying, you need testnet KAS tokens in your wallet:

1. **Get testnet KAS from a faucet** (search for "Kasplex testnet faucet")
2. **Or transfer from another testnet wallet**
3. **Switch to Kasplex L2 Testnet** in your wallet
4. **Make sure you have enough** for gas fees (usually 0.1-1 KAS is enough)

## Step 4: Create the .env File

### The .env file does NOT exist yet - you need to CREATE it!

**Location**: Root directory of your project (`kasparex-connect-wallet`)

**Steps**:

1. **Create the file**:
   - Windows: Right-click in the project folder → New → Text Document → Rename to `.env`
   - Or use your code editor (VS Code, etc.) to create a new file named `.env`

2. **Add your private key**:
   ```env
   PRIVATE_KEY=your_private_key_here
   ```
   
   **Important notes**:
   - If your private key starts with `0x`, **remove the 0x prefix**
   - Example: If MetaMask shows `0x1234abcd...`, use `1234abcd...`
   - No spaces around the `=` sign
   - No quotes needed

3. **Optional: Add other settings**:
   ```env
   PRIVATE_KEY=your_private_key_here
   
   # Optional: Distribution addresses (if different from deployer)
   DEVELOPER_ADDRESS=0x...
   BUILDER_ADDRESS=0x...
   ```

4. **Save the file**

## Step 5: Verify .env File is Ignored

Make sure `.env` is in your `.gitignore` file (it should already be there):

```gitignore
.env
.env.local
.env*.local
```

**Never commit `.env` to git!**

## Example .env File

Here's what a complete `.env` file looks like:

```env
# Private key for deployment (TESTNET - use a test wallet!)
PRIVATE_KEY=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef

# Optional: Custom addresses for revenue distribution
DEVELOPER_ADDRESS=0x1234567890123456789012345678901234567890
BUILDER_ADDRESS=0x0987654321098765432109876543210987654321

# Optional: Custom RPC URLs (defaults work fine)
KASPLEX_L2_TESTNET_RPC=https://rpc.kasplextest.xyz
```

## Step 6: Verify Setup

Once you've created the `.env` file, I can help you deploy!

## Rabby Wallet Specific Tips

- **Multiple Networks**: Rabby automatically detects and switches networks
- **Security**: Rabby has built-in security features and transaction simulation
- **Multi-Chain**: Works seamlessly with Kasplex L2 and other EVM chains
- **Backup**: Always backup your seed phrase in addition to saving the private key

## Quick Checklist

- [ ] Created a separate wallet for testing (not your main wallet)
- [ ] Got the private key from your wallet
- [ ] Created `.env` file in project root
- [ ] Added `PRIVATE_KEY=...` (without 0x prefix)
- [ ] Funded the wallet with testnet KAS tokens
- [ ] Verified `.env` is in `.gitignore`

## Still Need Help?

If you're having trouble:
1. **Which wallet are you using?** (MetaMask, Rabby, Trust Wallet, etc.)
2. **Have you added Kasplex L2 networks?** (Required for Rabby/MetaMask)
3. **Are you on testnet or mainnet?** (Use testnet first!)
4. **Do you have testnet KAS tokens?** (Required for deployment)
5. **Is your wallet connected to the correct network?** (Kasplex L2 Testnet)

Let me know and I can provide more specific guidance!

