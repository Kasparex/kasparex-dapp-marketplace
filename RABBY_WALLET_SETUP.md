# Rabby Wallet Setup Guide for Kasplex L2

## Quick Start: Getting Private Key from Rabby

### Method 1: From Account Details

1. **Open Rabby Wallet**
2. **Click the account icon** (top right corner)
3. **Click on your account name** to open account details
4. **Click the three dots menu** (⋮) or find "Export Private Key"
5. **Select "Export Private Key"**
6. **Enter your Rabby password**
7. **Copy the private key** (it will start with `0x`)

### Method 2: From Manage Accounts

1. **Open Rabby Wallet**
2. **Click the account icon** (top right)
3. **Select "Manage Accounts"**
4. **Click on the account you want to export**
5. **Click "Export Private Key"**
6. **Enter your password**
7. **Copy the private key**

### Method 3: From Settings

1. **Click the settings icon** (gear icon)
2. **Go to "Security" or "Advanced"**
3. **Find "Export Private Key"**
4. **Select your account**
5. **Enter password and copy**

---

## Setting Up Kasplex L2 Networks in Rabby

Rabby needs to know about Kasplex L2 networks to interact with them.

### Add Kasplex L2 Testnet

1. **Open Rabby Wallet**
2. **Click the network selector** (top center, shows current network)
3. **Click "Add Network"** or "Custom RPC"
4. **Fill in the details:**

```
Network Name: Kasplex L2 Testnet
RPC URL: https://rpc.kasplextest.xyz
Chain ID: 167012
Currency Symbol: KAS
Block Explorer URL: https://explorer.testnet.kasplextest.xyz
```

5. **Click "Save" or "Add Network"**

### Add Kasplex L2 Mainnet

1. **Follow same steps as above**
2. **Use these details:**

```
Network Name: Kasplex L2 Mainnet
RPC URL: https://evmrpc.kasplex.org
Chain ID: 202555
Currency Symbol: KAS
Block Explorer URL: https://explorer.kasplex.org
```

3. **Click "Save"**

---

## Important Notes for Rabby

### Security
- **Never share your private key** with anyone
- **Use a separate account** for testing/deployment
- **Backup your seed phrase** (12/24 words) in addition to private key
- Rabby has built-in transaction simulation for security

### Using Private Key in .env
- Remove the `0x` prefix when adding to `.env`
- Example: If Rabby shows `0x1234abcd...`, use `PRIVATE_KEY=1234abcd...`

### Network Switching
- Rabby automatically detects and prompts to switch networks
- Make sure you're on **Kasplex L2 Testnet** (Chain ID: 167012) for testnet deployment
- Make sure you're on **Kasplex L2 Mainnet** (Chain ID: 202555) for mainnet deployment

### Getting Testnet KAS
1. **Switch to Kasplex L2 Testnet** in Rabby
2. **Copy your wallet address** (click account → copy address)
3. **Get testnet tokens** from a Kasplex testnet faucet
4. **Verify balance** in Rabby wallet

---

## Troubleshooting

### "Cannot export private key"
- Make sure you're entering the correct password
- Try a different method (Method 1, 2, or 3)
- Check if your account is locked

### "Network not found"
- Make sure you've added Kasplex L2 networks manually
- Check RPC URL is correct
- Verify Chain ID matches

### "Insufficient funds"
- Make sure you're on the correct network
- Verify you have KAS tokens (not ETH or other tokens)
- Check balance in Rabby wallet

---

## Quick Checklist

- [ ] Installed Rabby Wallet
- [ ] Created a test account (separate from main wallet)
- [ ] Added Kasplex L2 Testnet network
- [ ] Added Kasplex L2 Mainnet network (if needed)
- [ ] Got private key from Rabby
- [ ] Funded wallet with testnet KAS tokens
- [ ] Created `.env` file with `PRIVATE_KEY=...` (no 0x prefix)

---

## Next Steps

Once you have:
1. ✅ Private key from Rabby
2. ✅ `.env` file created with `PRIVATE_KEY=...`
3. ✅ Testnet KAS tokens in your wallet

You're ready to deploy! Let me know and I'll help you deploy the contracts.

