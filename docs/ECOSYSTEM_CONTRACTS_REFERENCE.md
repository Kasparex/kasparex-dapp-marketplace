# Ecosystem Contracts Reference

Complete reference guide for all available ecosystem contracts in the Kasparex dApp marketplace.

---

## Core Infrastructure

### DAppRegistry
**Status**: ✅ Required for all dApps  
**Purpose**: Central registry for tracking deployed dApps and linking them to tokens  
**Key Features**:
- Register new dApps with metadata
- Link dApps to tokens
- Manage dApp status (active/inactive)
- Query dApps by token address
- Assign unique dApp IDs

**When to Use**: Always required - all dApps must be registered  
**Default**: ✅ Always connected

---

### Treasury
**Status**: Core infrastructure  
**Purpose**: Collects fees from dApps and manages revenue distribution  
**Key Features**:
- Fee collection from dApps
- Configurable revenue distribution (Treasury, Developers, Builders)
- Manual revenue distribution
- Emergency withdraw capability
- Default distribution: 40% Treasury, 30% Developers, 30% Builders

**When to Use**: Required if using FeeCollector or FeeHandler  
**Default**: ✅ Auto-connected if FeeCollector/FeeHandler is used

---

### FeeCollector
**Status**: ✅ Recommended (Default)  
**Purpose**: Simple interface for dApps to forward fees to Treasury  
**Key Features**:
- Simple `forwardFee()` function
- Automatic forwarding to Treasury
- Clean abstraction for fee collection

**When to Use**: For simple fee collection without complex distribution  
**Default**: ✅ Connected by default (recommended for most dApps)

---

### FeeHandler
**Status**: Optional (Advanced)  
**Purpose**: Advanced fee distribution with 60/40 split (Kasparex/Project)  
**Key Features**:
- 60% to Kasparex treasury
- 40% to project treasury
- Per-project fee tracking
- Batch fee collection

**When to Use**: If you need project-specific fee distribution  
**Default**: ⚠️ Only if explicitly selected (replaces FeeCollector)

---

## Rewards & Utility

### ProofOfUtility
**Status**: ✅ Required for Rewards  
**Purpose**: Tracks on-chain usage events and triggers RewardManager  
**Key Features**:
- Records usage events per user and dApp
- Triggers RewardManager for automatic reward distribution
- Batch event recording (gas optimization)
- Usage event history tracking

**When to Use**: If your dApp should distribute rewards to users  
**Default**: ✅ Connected by default (recommended for most dApps)

---

### RewardManager
**Status**: ✅ Required for Automatic Rewards  
**Purpose**: Distributes GRID or dApp tokens based on Proof-of-Utility events  
**Key Features**:
- Automatic reward distribution
- Configurable reward rates per dApp
- Support for GRID tokens or dApp-specific tokens
- Batch reward distribution

**When to Use**: If your dApp should automatically reward users with tokens  
**Default**: ✅ Connected by default (recommended for most dApps)

**Configuration**:
- Default reward rate: 100 basis points (1%)
- Default reward type: GRID Token
- Reward calculation: Action Value × Reward Rate

---

### RewardVault
**Status**: Infrastructure (Auto-connected)  
**Purpose**: Holds pre-minted GRID and dApp tokens for distribution  
**Key Features**:
- Token deposit/withdrawal
- Balance tracking per token
- RewardManager integration

**When to Use**: Required if using RewardManager (managed by admin)  
**Default**: ✅ Auto-connected if RewardManager is used

---

### GRIDToken
**Status**: Ecosystem Token (EVM / L2 representation)  
**Purpose**: Unified reward currency across dApps **on the EVM L2 where this contract is deployed** (e.g. Kasplex L2 or Igra L2).

**Canonical supply story:** Kasparex targets **one GRID brand** with fixed global supply anchored on **Kaspa L1 (KRC-20)** and **official bridged** ERC-20 GRID on each L2 - not unrelated mints. See **[GRID_CANONICAL_SUPPLY_MODEL.md](./GRID_CANONICAL_SUPPLY_MODEL.md)**.

**Key Features** (this repo’s Solidity `GRIDToken`):
- Fixed 10B supply (18 decimals) on deploy
- Deflationary mechanism (`burn` / `burnFrom`)
- Pre-minted to `RewardVault` at construction

**When to Use**: If using GRID tokens for rewards (default reward type) on that L2  
**Default**: ✅ Auto-connected if RewardManager is used

---

## User Features

### ProfileRegistry
**Status**: Optional  
**Purpose**: User profile storage using IPFS CIDs  
**Key Features**:
- Maps wallet addresses to IPFS CIDs
- Optional on-chain display names
- Verification status
- User preferences storage

**When to Use**: If your dApp needs user profile data  
**Default**: ⚠️ Only if explicitly selected

---

### LoyaltyPoints
**Status**: Optional  
**Purpose**: Long-term participation tracking (soulbound-like, non-transferable)  
**Key Features**:
- Total points tracking
- Participation days counter
- Streak tracking
- Points per action type
- Convertible to GRID/KREX later

**When to Use**: If your dApp should track long-term user engagement  
**Default**: ⚠️ Only if explicitly selected

---

### AffiliateManager
**Status**: Optional  
**Purpose**: Referral tracking and rewards  
**Key Features**:
- Tracks referrals via ?ref= parameter
- Referral count per affiliate/dApp
- Referral reward distribution
- Rate limiting (max referrals per day)

**When to Use**: If your dApp should support referral programs  
**Default**: ⚠️ Only if explicitly selected

---

## Access Control

### AuthorizationRegistry
**Status**: Optional  
**Purpose**: Access control and authorization management  
**Key Features**:
- Access token requirements
- Minimum balance checks
- Minimum holding time checks
- Access caching for gas optimization

**When to Use**: If your dApp needs access control or subscription-based features  
**Default**: ⚠️ Only if explicitly selected

---

### AccessControl
**Status**: Built-in (OpenZeppelin)  
**Purpose**: Role-based access control  
**Key Features**:
- Role management
- Permission checks
- Admin roles

**When to Use**: Usually built into contracts (not a separate integration)  
**Default**: ⚠️ Only if explicitly selected

---

## Subscriptions

### PlatformSubscription
**Status**: Optional  
**Purpose**: Platform-wide subscription management  
**Key Features**:
- Platform-level subscriptions
- Subscription tiers
- Payment handling

**When to Use**: If your dApp is subscription-based at platform level  
**Default**: ⚠️ Only if explicitly selected

---

### DAppSubscription
**Status**: Optional  
**Purpose**: dApp-specific subscription management  
**Key Features**:
- dApp-level subscriptions
- Subscription plans
- User subscription tracking

**When to Use**: If your dApp offers subscription features  
**Default**: ⚠️ Only if explicitly selected

---

### SubscriptionManager
**Status**: Optional  
**Purpose**: Subscription coordination between platform and dApps  
**Key Features**:
- Coordinates subscriptions
- Manages subscription relationships
- Handles subscription payments

**When to Use**: If using subscription features  
**Default**: ⚠️ Only if explicitly selected

---

## Dashboards

### UserProfileDashboard
**Status**: Optional (Frontend dApp)  
**Purpose**: User profile management dApp  
**Key Features**:
- Profile management UI
- Social links
- Preferences
- Icon customization

**When to Use**: If your dApp integrates with user profiles  
**Default**: ⚠️ Only if explicitly selected

---

### AdminDashboard
**Status**: Admin-only (Not for dApp integration)  
**Purpose**: Admin operations dashboard  
**Key Features**:
- Admin operations
- Contract management
- Fee rate configuration

**When to Use**: For admin operations (usually not needed in dApp contracts)  
**Default**: ❌ Not connected (admin-only)

---

## Default Integration Behavior

### Always Connected (Required)
- ✅ **DAppRegistry** - Required for all dApps

### Default Integration (Recommended)
- ✅ **FeeCollector** - Simple fee forwarding
- ✅ **ProofOfUtility** - Usage tracking
- ✅ **RewardManager** - Automatic rewards
- ✅ **RewardVault** - Token reserves (if RewardManager used)
- ✅ **GRIDToken** - Ecosystem token (if RewardManager used)
- ✅ **Treasury** - Fee collection (if FeeCollector/FeeHandler used)

### Optional (Only if Selected)
- ⚠️ **FeeHandler** - Advanced fee distribution
- ⚠️ **AffiliateManager** - Referral tracking
- ⚠️ **LoyaltyPoints** - Participation tracking
- ⚠️ **ProfileRegistry** - User profiles
- ⚠️ **AuthorizationRegistry** - Access control
- ⚠️ **SubscriptionManager** - Subscription features

---

## Integration Examples

### Example 1: Simple dApp (Default)
**Selected Contracts**:
- DAppRegistry ✅
- FeeCollector ✅
- ProofOfUtility ✅
- RewardManager ✅

**Use Case**: Most dApps that collect fees and reward users

### Example 2: Subscription dApp
**Selected Contracts**:
- DAppRegistry ✅
- FeeCollector ✅
- ProofOfUtility ✅
- RewardManager ✅
- AuthorizationRegistry ✅
- SubscriptionManager ✅

**Use Case**: dApps with subscription-based access

### Example 3: Referral dApp
**Selected Contracts**:
- DAppRegistry ✅
- FeeCollector ✅
- ProofOfUtility ✅
- RewardManager ✅
- AffiliateManager ✅

**Use Case**: dApps with referral programs

### Example 4: Advanced Fee Distribution
**Selected Contracts**:
- DAppRegistry ✅
- FeeHandler ✅ (instead of FeeCollector)
- ProofOfUtility ✅
- RewardManager ✅

**Use Case**: dApps needing project-specific fee distribution

---

**Last Updated**: November 13, 2025

