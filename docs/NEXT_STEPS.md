# Next Steps - Implementation Roadmap

## 🎯 Immediate Priorities

### 1. **Component Integration** (High Priority)
Replace image-based components with icon system:

- [ ] **Update `DAppCard.tsx`**
  - Replace `Image` component with `DAppIcon`
  - Remove `featuredImage` background
  - Use icon-based design

- [ ] **Update `DAppDetail.tsx`**
  - Add `TokenDisplay` component for tokenized dApps
  - Add `ProofOfUtility` component
  - Add `RewardsDisplay` component
  - Add `AffiliateWidget` component

- [ ] **Update `DAppSidebar.tsx`**
  - Replace user avatars with `UserIcon`
  - Add token information section

- [ ] **Update Header/Profile components**
  - Replace user avatars with `UserIcon`
  - Add profile dashboard link

### 2. **Environment Setup** (High Priority)

- [x] **Pinata API Configuration** ✅
  ```bash
  # Add to .env.local
  # Get your API keys from https://app.pinata.cloud/
  NEXT_PUBLIC_PINATA_API_KEY=your_api_key
  NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret
  ```
  
  **Test your setup:**
  - Visit `/test-ipfs` page to test IPFS upload/download
  - Verify files appear in your Pinata dashboard

- [ ] **Contract Addresses**
  - Update `src/lib/contracts/addresses.ts` with deployed contract addresses
  - Add new contract addresses (FeeHandler, RewardManager, GRIDToken, etc.)

### 3. **Contract Deployment** (High Priority)

- [ ] **Deploy Core Contracts**
  ```bash
  # Deploy to testnet first
  npm run hardhat:deploy:testnet
  
  # Contracts to deploy:
  # - GRIDToken
  # - DAppToken (factory or individual)
  # - ProofOfUtility
  # - AccessControl
  # - FeeHandler
  # - RewardManager
  # - AffiliateManager
  # - LoyaltyPoints
  # - RewardVault
  # - UserProfileDashboard
  # - AdminDashboard
  # - ProfileRegistry
  ```

- [ ] **Update DAppRegistry**
  - Deploy updated DAppRegistry with token support
  - Or upgrade existing contract if upgradeable

- [ ] **Configure Contracts**
  - Link contracts together (RewardManager → ProofOfUtility, etc.)
  - Set initial parameters (fee rates, reward rates, etc.)

### 4. **Testing** (Medium Priority)

- [ ] **Unit Tests**
  - Test IPFS upload/download
  - Test icon generation
  - Test token hooks

- [ ] **Integration Tests**
  - Test token deployment flow
  - Test reward distribution
  - Test access control

- [ ] **E2E Tests**
  - Test full dApp creation with token
  - Test user flow (connect → use → earn)

### 5. **UI/UX Polish** (Medium Priority)

- [ ] **Token Deployment Wizard**
  - Complete the deployment logic (currently placeholder)
  - Add factory contract or direct deployment
  - Add transaction status tracking

- [ ] **Network Selector**
  - Add to Header component
  - Show current network badge
  - Handle network switching

- [ ] **vProgs Simulator UI**
  - Add to admin/settings page
  - Allow testing dApp functionality
  - Show simulator state

### 6. **Documentation** (Low Priority)

- [ ] **User Guides**
  - How to deploy a tokenized dApp
  - How to earn rewards
  - How to use affiliate links

- [ ] **Developer Docs**
  - Contract interaction guide
  - IPFS integration guide
  - vProgs migration guide

- [ ] **API Documentation**
  - Hook usage examples
  - Component props documentation

## 🔧 Technical Debt

### Fixes Needed

- [ ] **Fix `useAffiliate` hook**
  - `useSearchParams` needs to be in Suspense boundary
  - Move to component level or wrap in Suspense

- [ ] **Complete Token Deployment**
  - Add factory contract or direct deployment logic
  - Handle deployment transaction

- [ ] **vProgs Contract Implementation**
  - Complete vProgs abstraction (currently uses simulator)
  - Add real vProgs API when available

### Optimizations

- [ ] **IPFS Caching**
  - Add service worker for IPFS content caching
  - Implement progressive loading

- [ ] **Icon Performance**
  - Memoize icon generation
  - Cache color calculations

- [ ] **Contract Calls**
  - Batch contract reads
  - Optimize polling intervals

## 📋 Deployment Checklist

Before going live:

- [ ] All contracts deployed and verified
- [ ] Contract addresses updated in code
- [ ] Fleek API keys configured
- [ ] IPFS gateway fallbacks tested
- [ ] Token deployment tested end-to-end
- [ ] Reward distribution tested
- [ ] Access control tested
- [ ] Network switching tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Security audit completed

## 🚀 Future Enhancements

- [ ] **DAO Governance**
  - Implement voting for fee rates
  - Treasury management
  - Parameter updates

- [ ] **Advanced Analytics**
  - Usage tracking dashboard
  - Revenue analytics
  - User engagement metrics

- [ ] **Social Features**
  - User profiles with social links
  - dApp reviews and ratings
  - Community discussions

- [ ] **Mobile App**
  - React Native version
  - Mobile wallet integration
  - Push notifications

## 📝 Quick Start Commands

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Compile contracts
npm run hardhat:compile

# Deploy contracts (testnet)
npm run hardhat:deploy:testnet

# Run migration script
node scripts/migrate-to-icons.js

# Test IPFS upload
# (Use the IPFS hooks in a component)
```

## 🎨 Design System

The new icon system replaces all images. Components to update:

- `DAppCard` → Use `DAppIcon`
- `DAppDetail` → Use `DAppIcon` + `TokenDisplay`
- User avatars → Use `UserIcon`
- Token displays → Use `TokenIcon`

All icons are generated deterministically from identifiers, so no image uploads needed!

