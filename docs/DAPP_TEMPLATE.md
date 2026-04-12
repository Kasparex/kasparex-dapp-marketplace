# dApp Template - Fill-In Form

This document provides a comprehensive template for building new dApps. Fill in all sections marked with `{{FIELD_NAME}}` and follow the integration checklist.

**IMPORTANT**: Fill in the dApp Description section below first. This will be used during the automated build process. You can fill in partial information, and the system will handle the rest - planning and building the dApp accordingly.

---

## dApp Description (Fill This First)

**This section is used during the automated build process. Fill in what you know, and the system will handle the rest.**

### What is your dApp?
Provide a clear description of what your dApp does:

```
{{DAPP_DESCRIPTION_FULL}}

Example:
"My dApp allows users to create and manage custom tokens. Users can mint tokens, 
transfer them, and set custom metadata. The dApp includes a marketplace where 
users can trade tokens with each other."
```

### What problem does it solve?
Describe the problem your dApp solves:

```
{{PROBLEM_SOLVED}}

Example:
"Currently, creating custom tokens requires technical knowledge and expensive 
deployment. This dApp makes token creation accessible to everyone with a simple 
interface and low fees."
```

### Who is it for?
Describe your target users:

```
{{TARGET_USERS}}

Example:
"Content creators, small businesses, and community organizers who want to 
create their own tokens without technical expertise."
```

### Key Features
List the main features your dApp should have:

```
{{KEY_FEATURES}}

Example:
- Create custom tokens with name, symbol, and supply
- Transfer tokens between users
- View token balances and transaction history
- Marketplace for token trading
- Token metadata management
```

### User Flow
Describe how users will interact with your dApp:

```
{{USER_FLOW}}

Example:
1. User connects wallet
2. User clicks "Create Token"
3. User fills in token details (name, symbol, supply)
4. User pays creation fee
5. Token is created and user receives initial supply
6. User can transfer tokens or list them on marketplace
```

### Additional Notes
Any other important information:

```
{{ADDITIONAL_NOTES}}

Example:
- Should support both fixed and unlimited supply tokens
- Need to integrate with Proof-of-Utility for rewards
- Should have admin functions to pause/unpause
```

---

## Basic Information

### dApp Details
- **Name**: `{{DAPP_NAME}}`
- **Slug**: `{{DAPP_SLUG}}` (URL-friendly, lowercase, hyphens)
- **Category**: `{{CATEGORY}}` (e.g., 'payment', 'governance', 'social', 'defi')
- **Version**: `{{VERSION}}` (e.g., '1.0.0')
- **Description**: `{{DAPP_DESCRIPTION}}`
- **Utility**: `{{UTILITY}}` (Brief one-line description)
- **Process**: `{{PROCESS}}` (How users interact with the dApp)
- **Benefits**: `{{BENEFITS}}` (What users gain from using it)

### Developer Information
- **Developer**: `{{DEVELOPER_NAME}}`
- **Developer Links**:
  - Website: `{{DEVELOPER_WEBSITE}}`
  - Telegram: `{{DEVELOPER_TELEGRAM}}`
  - X (Twitter): `{{DEVELOPER_TWITTER}}`

### Network & Status
- **Status**: `{{STATUS}}` ('Testnet' or 'Mainnet') - **Default: 'Testnet'**
- **Network**: `{{NETWORK_NAME}}` (e.g., 'Kasplex L2 Testnet') - **Default: 'Kasplex L2 Testnet'**
- **Supported Chain IDs**: `{{CHAIN_IDS}}` - **Default: [167012, 38836]** (Kasplex L2 Testnet: 167012, Igra Galleon Testnet: 38836)
  - Kasplex L2 Testnet: `167012`
  - Kasplex L2 Mainnet: `202555` (if deploying to mainnet)
  - Igra Galleon Testnet: `38836`
- **Provider**: `{{PROVIDER_NAME}}` - **Default: 'Kasparex'**

## Smart Contract

### Contract Details
- **Contract Name**: `{{CONTRACT_NAME}}`
- **Contract Description**: `{{CONTRACT_DESCRIPTION}}`
- **Contract Notice**: `{{CONTRACT_NOTICE}}`

### Contract Functions
List all your contract functions:

**Write Functions** (payable/non-payable):
- `functionName1(param1: type, param2: type)` - Description
- `functionName2(param1: type)` - Description

**Read Functions** (view):
- `getItem(id: uint256)` - Returns item data
- `getItems(offset: uint256, limit: uint256)` - Returns paginated items

**Admin Functions**:
- `setFee(newFee: uint256)` - Update fee (admin only)
- `setFeeCollector(newCollector: address)` - Update fee collector (admin only)

### Contract Events
- `ItemCreated(uint256 indexed itemId, address indexed user, uint256 amount, uint256 timestamp)`
- `ItemUpdated(uint256 indexed itemId, address indexed user, uint256 newAmount)`
- `FeeUpdated(uint256 oldFee, uint256 newFee)`

### Ecosystem Integration

**Selection Method**: Check the boxes below to select which ecosystem contracts to integrate. If no specific selection is made, the system will connect all suitable contracts by default based on your dApp's concept.

#### Core Infrastructure (Required/Recommended)

- [x] **DAppRegistry** - **REQUIRED** - Registry for tracking deployed dApps and linking them to tokens. All dApps must be registered here.
  - **Purpose**: Central registry for all dApps in the ecosystem
  - **When to use**: Always required
  - **Default**: ✅ Always connected

- [ ] **Treasury** - Core fee collection and revenue distribution contract
  - **Purpose**: Collects fees from dApps and manages revenue distribution (Treasury, Developers, Builders)
  - **When to use**: If your dApp collects fees that need centralized distribution
  - **Default**: ✅ Connected if using FeeCollector or FeeHandler

- [ ] **FeeCollector** - Simple fee forwarding interface
  - **Purpose**: Simple interface for dApps to forward fees to Treasury
  - **When to use**: For simple fee collection without complex distribution
  - **Default**: ✅ Connected by default (recommended for most dApps)

- [ ] **FeeHandler** - Advanced fee distribution (60/40 split: Kasparex/Project)
  - **Purpose**: Handles KAS fee splitting between Kasparex treasury (60%) and project treasury (40%)
  - **When to use**: If you need project-specific fee distribution
  - **Default**: ⚠️ Only if explicitly selected (replaces FeeCollector)

#### Rewards & Utility (Required for Rewards)

- [x] **ProofOfUtility** - **REQUIRED FOR REWARDS** - Usage tracking and reward triggering
  - **Purpose**: Tracks on-chain usage events and triggers RewardManager for automatic reward distribution
  - **When to use**: If your dApp should distribute rewards to users
  - **Default**: ✅ Connected by default (recommended for most dApps)

- [x] **RewardManager** - **REQUIRED FOR REWARDS** - Automatic token reward distribution
  - **Purpose**: Distributes GRID or dApp tokens based on Proof-of-Utility events
  - **When to use**: If your dApp should automatically reward users with tokens
  - **Default**: ✅ Connected by default (recommended for most dApps)

- [ ] **RewardVault** - Token reserves for RewardManager
  - **Purpose**: Holds pre-minted GRID and dApp tokens for distribution
  - **When to use**: Required if using RewardManager (managed by admin)
  - **Default**: ✅ Connected automatically if RewardManager is used

- [ ] **GRIDToken** - Ecosystem token for unified rewards
  - **Purpose**: Unified reward currency across all dApps
  - **When to use**: If using GRID tokens for rewards (default reward type)
  - **Default**: ✅ Connected automatically if RewardManager is used

#### User Features (Optional)

- [ ] **ProfileRegistry** - User profile storage (IPFS CIDs)
  - **Purpose**: Maps wallet addresses to IPFS CIDs for user profiles
  - **When to use**: If your dApp needs user profile data
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **LoyaltyPoints** - Long-term participation tracking
  - **Purpose**: Tracks user participation, streaks, and awards loyalty points (soulbound-like, non-transferable)
  - **When to use**: If your dApp should track long-term user engagement
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **AffiliateManager** - Referral tracking and rewards
  - **Purpose**: Tracks referrals via ?ref= parameter and distributes referral rewards
  - **When to use**: If your dApp should support referral programs
  - **Default**: ⚠️ Only if explicitly selected

#### Access Control (Optional)

- [ ] **AuthorizationRegistry** - Access control and authorization
  - **Purpose**: Manages access control for dApps and features
  - **When to use**: If your dApp needs access control or subscription-based features
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **AccessControl** - Role-based access control
  - **Purpose**: Standard OpenZeppelin AccessControl for role management
  - **When to use**: If your dApp needs role-based permissions
  - **Default**: ⚠️ Only if explicitly selected (usually built into contracts)

#### Subscriptions (Optional)

- [ ] **PlatformSubscription** - Platform-wide subscription management
  - **Purpose**: Manages platform-level subscriptions
  - **When to use**: If your dApp is subscription-based at platform level
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **DAppSubscription** - dApp-specific subscription management
  - **Purpose**: Manages subscriptions specific to individual dApps
  - **When to use**: If your dApp offers subscription features
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **SubscriptionManager** - Subscription coordination
  - **Purpose**: Coordinates between platform and dApp subscriptions
  - **When to use**: If using subscription features
  - **Default**: ⚠️ Only if explicitly selected

#### Dashboards (Optional)

- [ ] **UserProfileDashboard** - User profile management dApp
  - **Purpose**: Frontend dApp for managing user profiles
  - **When to use**: If your dApp integrates with user profiles
  - **Default**: ⚠️ Only if explicitly selected

- [ ] **AdminDashboard** - Admin operations dashboard
  - **Purpose**: Admin interface for managing ecosystem contracts
  - **When to use**: For admin operations (usually not needed in dApp contracts)
  - **Default**: ❌ Not connected (admin-only)

#### Default Integration Behavior

**If no specific selection is made**, the system will connect:
- ✅ **DAppRegistry** (always required)
- ✅ **FeeCollector** (simple fee forwarding)
- ✅ **ProofOfUtility** (usage tracking)
- ✅ **RewardManager** (automatic rewards)
- ✅ **RewardVault** (if RewardManager is used)
- ✅ **GRIDToken** (if RewardManager is used)

**To customize**, check/uncheck the boxes above. The deployment script will use your selections to configure the contract constructor parameters.

### RewardManager Configuration (Standard Defaults)

**Default Settings:**
- **Reward Rate**: `{{REWARD_RATE}}` - **Default: 100 basis points (1%)**
  - Common rates:
    - Small actions (tips, votes, quizzes): 50-200 basis points (0.5-2%)
    - Medium actions (payments, subscriptions): 100-500 basis points (1-5%)
    - Large actions (trades, deposits): 10-100 basis points (0.1-1%)
- **Reward Type**: `{{REWARD_TYPE}}` - **Default: GRID Token**
  - Options:
    - `GRID Token` (default) - Unified ecosystem token
    - `dApp Token` - dApp-specific token (requires token deployment)
- **dApp Token Address**: `{{DAPP_TOKEN_ADDRESS}}` - Required if using dApp token

**Configuration Script:**
After deploying your dApp, configure RewardManager:
```bash
# Using default settings (1% rate, GRID token)
npx hardhat run scripts/configure-{{contract-name}}-rewards.js --network kasplexL2Testnet

# Custom configuration
REWARD_RATE=200 USE_GRID=false DAPP_TOKEN_ADDRESS=0x... \
npx hardhat run scripts/configure-{{contract-name}}-rewards.js --network kasplexL2Testnet
```

**Reward Calculation:**
- Reward Amount = Action Value × Reward Rate
- Example: 0.01 KAS reward × 1% rate = 0.0001 KAS worth of tokens

### Contract Parameters (Defaults Provided)

**Fee Configuration:**
- **Fee Amount**: `{{FEE_AMOUNT}}` (in KAS, e.g., 0.1 KAS = 0.1 * 10^18) - **Default: 0.1 KAS (100000000000000000 wei)**
- **Fee Percentage**: `{{FEE_PERCENTAGE}}` (basis points, e.g., 100 = 1%) - **Default: 100 (1%)**
  - Common fee percentages:
    - 1% = 100 basis points
    - 2% = 200 basis points
    - 5% = 500 basis points
    - 10% = 1000 basis points

**Standard Defaults:**
- **Transaction Timeout**: 5 minutes (300 seconds)
- **Max Items per Page**: 50 items
- **Min/Max Values**: Define based on your use case
- **Access Control**: Owner-only for admin functions (default)
- **Reentrancy Protection**: Enabled by default (using ReentrancyGuard)

**Other Parameters**: `{{OTHER_PARAMS}}`
- List any custom parameters specific to your dApp

## Frontend Widget

### Widget Details
- **Widget Name**: `{{WidgetName}}`
- **Component File**: `src/components/dapps/{{WidgetName}}.tsx`

### UI Components
List all UI components needed:

- [ ] Header with title and description
- [ ] Form for creating/updating items
- [ ] List/table for displaying items
- [ ] Action buttons
- [ ] Loading indicators
- [ ] Error messages
- [ ] Success messages
- [ ] Fee display
- [ ] Stats display

### User Interactions
- **Primary Action**: `{{PRIMARY_ACTION}}` (e.g., 'Create Item', 'Submit Proposal')
- **Secondary Actions**: `{{SECONDARY_ACTIONS}}` (e.g., 'Edit', 'Delete', 'Vote')
- **Form Fields**: `{{FORM_FIELDS}}` (e.g., 'Title', 'Description', 'Amount')

## Custom Hook

### Hook Details
- **Hook Name**: `use{{HookName}}`
- **Hook File**: `src/hooks/use{{HookName}}.ts`

### Hook Functions
- `createItem(param1: string, param2: bigint)` - Create new item
- `updateItem(itemId: bigint, newValue: string)` - Update existing item
- `getItem(itemId: bigint)` - Get single item
- `refreshItems()` - Refresh items list

### ⚠️ CRITICAL: TypeScript Type Handling

**ALWAYS properly handle types from contract reads!**

The `readContract()` function from wagmi/viem returns `unknown` type. You MUST type-check before using the result:

**❌ WRONG - This will cause TypeScript errors:**
```typescript
const count = await publicClient.readContract({...});
const countBigInt = BigInt(count || 0); // ERROR: count might be an object!
```

**✅ CORRECT - Always check types explicitly:**
```typescript
const countResult = await publicClient.readContract({
  address: contractAddress as `0x${string}`,
  abi: YOUR_ABI,
  functionName: 'questionCount',
});

// Properly handle unknown type
let count: bigint;
if (typeof countResult === 'bigint') {
  count = countResult;
} else if (typeof countResult === 'number') {
  count = BigInt(countResult);
} else if (typeof countResult === 'string') {
  count = BigInt(countResult);
} else {
  count = 0n; // Safe fallback
}
```

**For arrays/structs:**
```typescript
const result = await publicClient.readContract({...});
// Type guard for arrays
if (Array.isArray(result)) {
  const [id, name, value] = result;
  // Use typed values
}
```

**For objects/structs:**
```typescript
const result = await publicClient.readContract({...});
// Type guard for objects
if (result && typeof result === 'object' && 'id' in result) {
  const item = result as { id: bigint; name: string; value: bigint };
  // Use typed item
}
```

**Key Rules:**
1. ✅ Always check `typeof` before type conversions
2. ✅ Use explicit type guards for complex types
3. ✅ Provide safe fallbacks (e.g., `0n` for bigint, `[]` for arrays)
4. ✅ Never use `BigInt(value || 0)` directly - check type first
5. ✅ Test TypeScript compilation before pushing (`npm run build`)

### Hook State
- `items: {{ItemInterface}}[]` - Array of items
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message
- `itemCount: bigint | null` - Total item count
- `fee: bigint | null` - Transaction fee

### Data Interfaces
```typescript
export interface {{ItemInterface}} {
  id: bigint;
  field1: string;
  field2: bigint;
  field3: address;
  timestamp: bigint;
}
```

## ABI Definition

### Contract ABI
Add your contract ABI to `src/lib/contracts/abis.ts`:

**CRITICAL: Always use JSON objects, never string signatures!** viem/wagmi requires JSON objects with `type`, `name`, `inputs`, `outputs` properties.

```typescript
export const {{CONTRACT_NAME}}_ABI = [
  {
    type: "function",
    name: "yourMainFunction",
    stateMutability: "payable",
    inputs: [
      { internalType: "uint256", name: "_param1", type: "uint256" },
      { internalType: "address", name: "_param2", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getItem",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_itemId", type: "uint256" }
    ],
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "text", type: "string" }
        ],
        internalType: "struct YourContract.Item",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "getItems",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit", type: "uint256" }
    ],
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "text", type: "string" }
        ],
        internalType: "struct YourContract.Item[]",
        name: "",
        type: "tuple[]"
      }
    ]
  },
  {
    type: "function",
    name: "itemCount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "fee",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ItemCreated",
    inputs: [
      { indexed: true, internalType: "uint256", name: "itemId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;
```

See `docs/ABI_FORMAT_GUIDE.md` for complete format requirements.

## Address Management

### Contract Addresses
Add to `src/lib/contracts/addresses.ts`:

```typescript
kasplexL2Testnet: {
  {{CONTRACT_NAME}}: "0x...", // Your contract address
  // ...
},
kasplexL2Mainnet: {
  {{CONTRACT_NAME}}: "0x...", // Your contract address (if deploying to mainnet)
  // ...
},
igraGalleonTestnet: {
  {{CONTRACT_NAME}}: "0x...", // Your contract address (Igra Testnet)
  // ...
},
```

**Note**: You should deploy to both Kasplex L2 Testnet (167012) and Igra Galleon Testnet (38836) for maximum compatibility.

## Deployment

### Deployment Script
- **Script File**: `scripts/deploy-{{contract-name}}.js`
- **Network**: `{{DEPLOYMENT_NETWORK}}` - **Default: 'kasplexL2Testnet'**
  - Recommended: Deploy to both `kasplexL2Testnet` and `igraGalleonTestnet`
- **Deployer Address**: `{{DEPLOYER_ADDRESS}}` (will be detected automatically)

### Deployment Steps
1. Deploy contract
2. Register in DAppRegistry
3. (Optional) Deploy token
4. (Optional) Link token to dApp
5. (Optional) Set dApp ID in contract

### Environment Variables Required
- `FEE_COLLECTOR_ADDRESS` (or `FEE_HANDLER_ADDRESS`)
- `DAPP_REGISTRY_ADDRESS`
- `PROOF_OF_UTILITY_ADDRESS` (if using)
- `AFFILIATE_MANAGER_ADDRESS` (if using)
- `REWARD_VAULT_ADDRESS` (if deploying token)

## Integration Steps

Follow the integration checklist in `templates/integration-checklist.md`:

1. [ ] Add contract ABI
2. [ ] Add contract address
3. [ ] Create custom hook
4. [ ] Create widget component
5. [ ] Add dApp entry
6. [ ] Add widget rendering
7. [ ] Test thoroughly
8. [ ] Deploy

## Mobile & Responsive Design

### Breakpoints
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

### Mobile Considerations
- Use `flex-col` on mobile, `sm:flex-row` on larger screens
- Ensure buttons are at least 44x44px for touch
- Use readable font sizes (min 14px)
- Test on iOS Safari and Android Chrome
- Use hamburger menu for navigation if needed

## vProgs Preparation

### Compatibility Notes
- Use standard Solidity patterns
- Mark external functions appropriately
- Consider gas optimization
- Use network abstraction layer when available
- Standardize contract interfaces

## Example Reference

See the **DAO Voting dApp** for a complete working example:
- Contract: `contracts/DAOVoting.sol`
- Hook: `src/hooks/useDAOVoting.ts`
- Widget: `src/components/dapps/DAOVotingWidget.tsx`
- Integration: `src/components/DAppWidget.tsx` (lines 114-150)

## Next Steps

1. Fill in all `{{FIELD_NAME}}` placeholders in this document
2. Copy template files and replace placeholders
3. Follow the integration checklist
4. Test thoroughly
5. Deploy and verify

