# KAS Tipping System - Testing Guide

## 🎯 Overview

This guide will help you test all the features of the KAS Tipping System dApp, including:
- ✅ Tipping functionality
- ✅ Leaderboard
- ✅ Proof-of-Utility tracking
- ✅ GRID token rewards
- ✅ Affiliate system
- ✅ Token rewards (KAST)

## 📋 Prerequisites

1. **Connect Wallet** to Kasplex L2 Testnet (Chain ID: 167012)
2. **Have Test KAS** in your wallet for gas and tipping
3. **Access the dApp** at: `/dapps/13` or search for "KAS Tipping System"

## 🧪 Testing Checklist

### 1. Basic Tipping

**Test Steps:**
1. Navigate to the KAS Tipping System dApp
2. Go to "Send Tip" tab
3. Enter a recipient address (can be any valid address)
4. Enter a tip amount (e.g., 0.1 KAS)
5. Click "Send Tip"
6. Approve the transaction in your wallet

**Expected Results:**
- ✅ Transaction succeeds
- ✅ Success message appears
- ✅ Fee is calculated and displayed (2% default)
- ✅ Recipient receives tip amount minus fee

**Verify:**
- Check transaction on explorer
- Verify recipient received the tip
- Check that fee was sent to FeeHandler

### 2. Leaderboard

**Test Steps:**
1. Send multiple tips from the same wallet
2. Go to "Leaderboard" tab
3. Check if you appear in the top tippers list

**Expected Results:**
- ✅ Your address appears in the leaderboard
- ✅ Total tipped amount is displayed
- ✅ Rank is shown (if in top 100)

**Verify:**
- Check "My Stats" tab for your total tipped amount
- Verify rank updates after each tip

### 3. Proof-of-Utility

**Test Steps:**
1. Send a tip
2. Check the "Proof-of-Utility" component (should be visible in the widget)
3. Look for "tip" events

**Expected Results:**
- ✅ Usage event is recorded
- ✅ Event shows: user address, dApp contract, action type "tip", timestamp
- ✅ Event count increases

**Verify:**
- Check ProofOfUtility contract events on explorer
- Verify event is linked to your address

### 4. GRID Token Rewards

**Prerequisites:**
- RewardManager must be configured for KASTip dApp
- RewardVault must have GRID tokens

**Test Steps:**
1. Configure RewardManager (see configuration below)
2. Send a tip
3. Check "Rewards Display" component
4. Look for GRID token balance

**Expected Results:**
- ✅ GRID balance increases after tipping
- ✅ Rewards are distributed automatically
- ✅ Balance updates in real-time

**Configuration:**
```javascript
// In Hardhat console or script
const RewardManager = await ethers.getContractFactory('RewardManager');
const rewardManager = RewardManager.attach('0x2044FEb08a4Cb14Ff736b00f947E017044da50E6');
const kasTipAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';

// Set reward rate (100 = 1% of tip amount)
await rewardManager.setRewardRate(kasTipAddress, 100);

// Use GRID token for rewards
await rewardManager.setRewardType(kasTipAddress, true);
```

### 5. KAST Token Rewards

**Prerequisites:**
- RewardManager configured to use dApp token instead of GRID

**Test Steps:**
1. Configure RewardManager to use KAST token (see configuration below)
2. Send a tip
3. Check "Rewards Display" component
4. Look for KAST token balance

**Expected Results:**
- ✅ KAST balance increases after tipping
- ✅ Rewards are minted automatically
- ✅ Balance updates in real-time

**Configuration:**
```javascript
const RewardManager = await ethers.getContractFactory('RewardManager');
const rewardManager = RewardManager.attach('0x2044FEb08a4Cb14Ff736b00f947E017044da50E6');
const kasTipAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';
const kastTokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';

// Set reward rate
await rewardManager.setRewardRate(kasTipAddress, 100);

// Use dApp token (KAST) instead of GRID
await rewardManager.setRewardType(kasTipAddress, false);

// Link KAST token to RewardManager
await rewardManager.setDAppToken(kasTipAddress, kastTokenAddress);
```

### 6. Affiliate System

**Test Steps:**
1. Connect your wallet
2. Go to "Send Tip" tab
3. Find the "Affiliate Widget" section
4. Copy your referral link
5. Share the link with someone (or use it yourself in incognito)
6. When they tip using your link, check your referral count

**Expected Results:**
- ✅ Referral link is generated
- ✅ Link includes your address as `?ref=YOUR_ADDRESS`
- ✅ Referral count increases when someone uses your link
- ✅ Referrals are tracked on-chain

**Verify:**
- Check AffiliateManager contract for your referral count
- Verify referral events are emitted

### 7. Referral Integration

**Test Steps:**
1. Get a referral link from another user
2. Open the link (e.g., `/dapps/13?ref=0x...`)
3. Send a tip
4. Enter the referral address in the "Referral Address" field (optional, but recommended)
5. Complete the tip

**Expected Results:**
- ✅ Referral is recorded in AffiliateManager
- ✅ Referrer earns rewards (if configured)
- ✅ Referral appears in referrer's stats

### 8. Fee Collection

**Test Steps:**
1. Send a tip
2. Check the transaction details
3. Verify fee was deducted (2% default)

**Expected Results:**
- ✅ Fee is calculated correctly (2% of tip amount)
- ✅ Fee is sent to FeeHandler
- ✅ FeeHandler splits it 60/40 (Kasparex/Project)

**Verify:**
- Check FeeHandler contract balance
- Verify split to treasuries

### 9. Statistics

**Test Steps:**
1. Go to "My Stats" tab
2. Check your tipping statistics

**Expected Results:**
- ✅ Total Tipped amount is displayed
- ✅ Tip Count is shown
- ✅ Leaderboard Rank is displayed (if in top 100)

### 10. Multiple Tips

**Test Steps:**
1. Send tips to different recipients
2. Send tips with different amounts
3. Send tips with and without referrals

**Expected Results:**
- ✅ All tips are recorded
- ✅ Leaderboard updates correctly
- ✅ Statistics are accurate
- ✅ All events are tracked

## 🔧 Configuration Required

### RewardManager Setup

Before testing rewards, configure RewardManager:

```bash
npx hardhat console --network kasplexL2Testnet
```

```javascript
const RewardManager = await ethers.getContractFactory('RewardManager');
const rewardManager = RewardManager.attach('0x2044FEb08a4Cb14Ff736b00f947E017044da50E6');
const kasTipAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';
const kastTokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';

// Option 1: Use GRID tokens
await rewardManager.setRewardRate(kasTipAddress, 100); // 1% reward rate
await rewardManager.setRewardType(kasTipAddress, true);

// Option 2: Use KAST tokens
await rewardManager.setRewardRate(kasTipAddress, 100);
await rewardManager.setRewardType(kasTipAddress, false);
await rewardManager.setDAppToken(kasTipAddress, kastTokenAddress);
```

### Ensure RewardVault Has Tokens

For GRID rewards:
```javascript
const GRIDToken = await ethers.getContractFactory('GRIDToken');
const gridToken = GRIDToken.attach('0x6c4B153eE2Fe3EfcD9CbF5D4A55e058d40Ec86a2');
const rewardVault = '0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD';

// Check balance
await gridToken.balanceOf(rewardVault);

// If needed, transfer GRID to RewardManager
const rewardManager = '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
await gridToken.transfer(rewardManager, ethers.parseEther('1000')); // Transfer 1000 GRID
```

## 🐛 Troubleshooting

### Tips Not Recording Events

**Issue:** Proof-of-Utility events not showing

**Solution:**
- Check that dApp ID is set in KASTip contract
- Verify ProofOfUtility contract address is correct
- Check contract events on explorer

### Rewards Not Showing

**Issue:** GRID/KAST rewards not appearing

**Solution:**
- Verify RewardManager is configured for KASTip
- Check RewardVault has GRID tokens (for GRID rewards)
- Verify reward rate is set (> 0)
- Check that ProofOfUtility is calling RewardManager

### Leaderboard Not Updating

**Issue:** Leaderboard shows old data

**Solution:**
- Refresh the page
- Check that tips are being sent successfully
- Verify contract state on explorer

### Affiliate Not Working

**Issue:** Referrals not being recorded

**Solution:**
- Check AffiliateManager contract address
- Verify referral address is valid
- Check rate limits (max 100 referrals per day per affiliate)

## 📊 Expected Contract Interactions

When you send a tip, the following happens:

1. **KASTip.tip()** is called
2. Fee is calculated and sent to **FeeHandler.collectFee()**
3. Tip is sent to recipient
4. **AffiliateManager.recordReferral()** is called (if referral provided)
5. **ProofOfUtility.recordUsage()** is called
6. Leaderboard is updated
7. **RewardManager.distributeReward()** is called (via ProofOfUtility)
8. GRID or KAST tokens are distributed to user

## ✅ Success Criteria

All features are working if:
- ✅ Tips can be sent successfully
- ✅ Leaderboard shows top tippers
- ✅ Proof-of-Utility events are recorded
- ✅ Rewards are distributed (after configuration)
- ✅ Affiliate links work and track referrals
- ✅ Fees are collected and split correctly
- ✅ Statistics are accurate

## 🚀 Next Steps After Testing

1. **Configure RewardManager** for production rates
2. **Fund RewardVault** with GRID tokens
3. **Test with multiple users** to verify leaderboard
4. **Monitor gas costs** and optimize if needed
5. **Collect feedback** from test users

---

**Happy Testing!** 🎉

If you encounter any issues, check the contract addresses in `KASTIP_DEPLOYMENT_SUCCESS.md` and verify all ecosystem contracts are deployed correctly.

