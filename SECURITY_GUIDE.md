# Security Guide: Private Key Management

## Overview

This guide explains how to securely manage private keys for deploying and managing smart contracts on the Kasparex platform.

## ⚠️ CRITICAL SECURITY WARNINGS

1. **NEVER commit private keys to version control**
2. **NEVER share your private key with anyone**
3. **NEVER use your main wallet's private key for development**
4. **Always use testnet for development and testing**
5. **Use separate wallets for different environments (testnet/mainnet)**

## Environment Variables Setup

### Step 1: Create `.env` File

Create a `.env` file in the root directory of your project:

```bash
# .env file - NEVER COMMIT THIS FILE!
```

### Step 2: Add Private Key

Add your private key to the `.env` file:

```env
# Private key for contract deployment (testnet recommended for development)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Optional: Distribution addresses
DEVELOPER_ADDRESS=0x...
BUILDER_ADDRESS=0x...

# Optional: Custom RPC URLs (defaults are used if not set)
KASPLEX_L2_MAINNET_RPC=https://evmrpc.kasplex.org
KASPLEX_L2_TESTNET_RPC=https://rpc.kasplextest.xyz
```

### Step 3: Verify `.gitignore`

Ensure your `.gitignore` file includes:

```gitignore
# Environment variables
.env
.env.local
.env*.local
```

## Best Practices

### 1. Use Separate Wallets

- **Development Wallet**: Small amount of testnet tokens for testing
- **Deployment Wallet**: Separate wallet for deploying to mainnet
- **Treasury Wallet**: Secure wallet for collecting fees

### 2. Private Key Security

**Option A: Environment Variables (Recommended for Development)**
- Simple and secure when properly configured
- Never commit `.env` files
- Use different keys for testnet and mainnet

**Option B: Hardware Wallet (Recommended for Production)**
- Use Ledger or Trezor for mainnet deployments
- Keys never leave the device
- Most secure option

**Option C: Encrypted Storage (Advanced)**
- Encrypt keys using libraries like `node-forge` or `crypto`
- Store encrypted keys separately from passwords
- Decrypt at runtime

### 3. Environment Separation

```env
# .env.testnet (for testnet)
PRIVATE_KEY=testnet_private_key_here
KASPLEX_L2_TESTNET_RPC=https://rpc.kasplextest.xyz

# .env.mainnet (for mainnet - NEVER commit!)
PRIVATE_KEY=mainnet_private_key_here
KASPLEX_L2_MAINNET_RPC=https://evmrpc.kasplex.org
```

### 4. Access Control

- Use multi-signature wallets for treasury contracts
- Implement role-based access control
- Limit owner permissions to essential functions only

## Deployment Security Checklist

Before deploying to mainnet:

- [ ] Private key is stored securely (not in code/repository)
- [ ] `.env` file is in `.gitignore`
- [ ] Tested on testnet first
- [ ] Verified contract code and parameters
- [ ] Treasury addresses are correct
- [ ] Distribution percentages are verified
- [ ] Using separate wallet for deployment
- [ ] Have backup of private key in secure location
- [ ] Consider using hardware wallet for mainnet

## Frontend Environment Variables

For frontend contracts, use `NEXT_PUBLIC_` prefix:

```env
# Public contract addresses (safe to expose)
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS=0x...
NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS=0x...
NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS=0x...
NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS=0x...
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS=0x...
```

These are public addresses and safe to expose in the frontend.

## Recovery Procedures

### If Private Key is Compromised

1. **Immediately transfer all funds** from the compromised wallet
2. **Revoke permissions** on any contracts owned by the wallet
3. **Deploy new contracts** with a new wallet
4. **Update all contract addresses** in environment variables
5. **Notify affected users** if necessary

### If `.env` File is Accidentally Committed

1. **Remove from git history** (if caught early):
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file"
   ```

2. **Rotate the private key** immediately
3. **Update all deployments** with new key
4. **Consider using git-secret** for encrypted secrets

## Additional Security Measures

### 1. Use Environment-Specific Files

```bash
.env.development
.env.testnet
.env.mainnet
```

### 2. Implement Rate Limiting

For production deployments, implement rate limiting to prevent abuse.

### 3. Monitor Transactions

Set up monitoring for:
- Large transactions
- Unusual contract interactions
- Failed transactions

### 4. Regular Security Audits

- Review contract code regularly
- Audit access controls
- Check for vulnerabilities
- Update dependencies

## Resources

- [Hardhat Security Best Practices](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/security)
- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

## Support

If you suspect a security issue:
1. Do not share details publicly
2. Contact the Kasparex security team
3. Follow responsible disclosure practices

---

**Remember: Security is a shared responsibility. Stay vigilant and follow best practices.**

