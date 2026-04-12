# dApp Template - Fill-In Form

This document provides a comprehensive template for building new dApps. Fill in all sections marked with `{{FIELD_NAME}}` and follow the integration checklist.

**IMPORTANT**: Fill in the dApp Description section below first. This will be used during the automated build process. You can fill in partial information, and the system will handle the rest - planning and building the dApp accordingly.

---

## dApp Description (Fill This First)

**This section is used during the automated build process. Fill in what you know, and the system will handle the rest.**

### What is your dApp?
Provide a clear description of what your dApp does:

```
Quiz-to-Earn

What it does:
A quiz game where users answer crypto or ecosystem-related questions to earn small GRID or token rewards for each correct answer.
Questions can be about Kaspa or general blockdag topics.

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
- **Name**: `{{Quiz-to-Earn}}`
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
Choose which ecosystem contracts to integrate:

- [ ] **FeeCollector** - Simple fee forwarding
- [ ] **FeeHandler** - Advanced fee distribution (60/40 split)
- [ ] **ProofOfUtility** - Usage tracking for rewards
- [ ] **AffiliateManager** - Referral tracking
- [ ] **DAppRegistry** - dApp registration
- [ ] **RewardManager** - Token rewards

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

```typescript
export const {{CONTRACT_NAME}}_ABI = [
  "function yourMainFunction(uint256 _param1, address _param2) external payable",
  "function getItem(uint256 _itemId) external view returns (YourStruct)",
  "function getItems(uint256 _offset, uint256 _limit) external view returns (YourStruct[])",
  "function itemCount() external view returns (uint256)",
  "function fee() external view returns (uint256)",
  "event ItemCreated(uint256 indexed itemId, address indexed user, uint256 amount, uint256 timestamp)",
] as const;
```

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

