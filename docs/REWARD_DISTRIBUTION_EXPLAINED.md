# Reward Distribution - Simple Explanation

## How It Works

When you use a dApp on Kasparex, you automatically earn rewards! Here's how it works in simple terms:

### The Flow

```
1. You Use a dApp
   ↓
2. Complete a Transaction
   ↓
3. System Calculates Your Reward
   ↓
4. Reward is Distributed to Your Wallet
   ↓
5. Your Balance Updates
```

---

## What Rewards Do You Get?

### 1. **GRID Token** (Global Reward Token)
- **What it is:** The main reward token for the entire Kasparex ecosystem
- **Where it goes:** Your connected wallet
- **How much:** Depends on your KREX tier and NFT holdings

### 2. **dApp Token** (Local Reward Token)
- **What it is:** Specific token for the dApp you used
- **Where it goes:** Your connected wallet
- **How much:** Depends on the dApp and your tier

### 3. **XP (Experience Points)**
- **What it is:** Points that track your activity
- **Where it goes:** Your account profile
- **How much:** Based on your tier and activity

---

## How Rewards Are Calculated

### Base Reward
Every action has a base reward value. For example:
- **Vote in DAO:** Base reward = 1.0 KAS value
- **Send Payment:** Base reward = 0.5 KAS value

### Your Multiplier
Your reward is multiplied based on:

1. **KREX Tier:**
   - No KREX: 1.0x (base)
   - Bronze: 1.1x (+10%)
   - Silver: 1.2x (+20%)
   - Gold: 1.5x (+50%)
   - Platinum: 2.0x (+100%)
   - Diamond: 3.0x (+200%)

2. **NFT Holdings:**
   - Regular NFT: +0.1x
   - Diamond NFT: +0.2x
   - Rarest NFT: +0.5x

3. **Node Provider** (Future):
   - Running a node: +0.3x

### Example Calculation

**Scenario:**
- Action: Vote in DAO (base = 1.0 KAS)
- Your Tier: Gold (1.5x multiplier)
- You have: Diamond NFT (+0.2x)
- **Total Multiplier:** 1.5 + 0.2 = 1.7x

**Reward:**
- GRID: 1.0 × 1.7 = **1.7 GRID**
- dApp Token: 1.0 × 1.7 = **1.7 Tokens**
- XP: 1.0 × 1.7 = **1.7 XP**

---

## Network Differences

### L1 (Kaspa Native)
- **How it works:** Rewards are recorded via API
- **Status:** Checked via Cloudflare D1 database
- **Distribution:** Processed in background
- **Time:** Usually within a few minutes

### L2 (EVM - Kasplex/Igra)
- **How it works:** Rewards are distributed via smart contract
- **Status:** Immediate (on-chain)
- **Distribution:** Automatic via `SecureProofOfUtility` contract
- **Time:** Instant (when transaction confirms)

---

## Where to See Your Rewards

### 1. **Transaction Details**
After completing a transaction, you'll see:
- ✅ Transaction hash
- ✅ Fee deducted
- ✅ Reward status
- ✅ GRID reward amount
- ✅ dApp token reward amount

### 2. **Your Balance**
- **GRID Balance:** Shown in the GRID token box
- **dApp Token Balance:** Shown in the dApp's token display
- **XP:** Shown in your profile

### 3. **Transaction History**
- View all your transactions
- See reward status for each
- Check which rewards were applied

---

## Reward Status

### Pending
- ✅ Transaction completed
- ⏳ Reward is being calculated
- ⏳ Waiting for distribution

### Processing
- ✅ Reward calculated
- ⏳ Currently being distributed
- ⏳ Should complete soon

### Completed
- ✅ Reward calculated
- ✅ Reward distributed
- ✅ Balance updated
- ✅ You can see it in your wallet!

### Failed
- ❌ Something went wrong
- ❌ Check error message
- ❌ Contact support if persists

---

## Fees vs Rewards

### Important: They're Separate!

**Fees:**
- What you **pay** to use the dApp
- Deducted from your transaction
- Goes to project treasury and Kasparex

**Rewards:**
- What you **earn** for using the dApp
- Added to your wallet
- Based on your tier and activity

**Example:**
- You pay: 1.0 KAS fee (with 20% discount = 0.8 KAS)
- You earn: 1.7 GRID + 1.7 dApp tokens (worth more than the fee!)

---

## How to Verify Your Reward

### For L1 (Kaspa Native):

1. **Check Transaction:**
   - Look for transaction hash
   - Verify on Kaspa explorer

2. **Check Reward Status:**
   - Use the reward status component
   - Or check via API: `/api/rewards/l1/status/{rewardId}`

3. **Check Database:**
   - Use D1 verification guide
   - Query by transaction hash or user address

### For L2 (EVM):

1. **Check Transaction:**
   - Look for transaction hash
   - Verify on block explorer (Kasplex/Igra)

2. **Check Contract Call:**
   - Verify `SecureProofOfUtility` contract was called
   - Check contract events for reward distribution

3. **Check Balance:**
   - GRID token balance should increase
   - dApp token balance should increase

---

## Common Questions

### Q: Why didn't I get a reward?
**A:** Check:
- Was the transaction successful?
- Is your reward status "completed"?
- Did you check the correct wallet address?
- Is the dApp configured for rewards?

### Q: How long does it take?
**A:**
- **L2:** Instant (when transaction confirms)
- **L1:** Usually 1-5 minutes

### Q: Can I see my reward history?
**A:** Yes! Check:
- Transaction history component
- Your wallet balance changes
- D1 database (for L1)

### Q: Do I need to do anything?
**A:** No! Rewards are automatic. Just:
1. Use the dApp
2. Complete transactions
3. Rewards appear in your wallet

---

## Summary

✅ **Rewards are automatic** - No extra steps needed  
✅ **Based on your tier** - Higher tier = more rewards  
✅ **Separate from fees** - You earn even after paying fees  
✅ **Multiple tokens** - GRID, dApp tokens, and XP  
✅ **Trackable** - See status and history  

**Just use dApps and earn rewards!** 🎉
