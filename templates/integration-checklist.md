# dApp Integration Checklist

Use this checklist to ensure your dApp is fully integrated into the system.

## Prerequisites

- [ ] Fill out `docs/DAPP_TEMPLATE.md` with dApp description (especially the "dApp Description" section at the beginning)
- [ ] Smart contract deployed and verified
- [ ] Contract address available for both networks:
  - [ ] Kasplex L2 Testnet (Chain ID: 167012)
  - [ ] Igra Caravel Testnet (Chain ID: 19416)
- [ ] Contract ABI available
- [ ] Test networks configured

## Step 1: Contract Configuration

- [ ] Add contract ABI to `src/lib/contracts/abis.ts`
  - Export as `export const {{CONTRACT_NAME}}_ABI = [...]`
  - Follow the pattern of existing ABIs (e.g., `DAO_VOTING_ABI`)

- [ ] Add contract address to `src/lib/contracts/addresses.ts`
  - Add to `HARDCODED_FALLBACK_ADDRESSES` for each network:
    - `kasplexL2Testnet` (Chain ID: 167012)
    - `igraCaravelTestnet` (Chain ID: 19416)
    - `kasplexL2Mainnet` (Chain ID: 202555) - if deploying to mainnet
  - Add to `DEFAULT_CONTRACT_ADDRESSES` for each network
  - Use the contract name as the key (e.g., `{{CONTRACT_NAME}}: "0x..."`)

## Step 2: Custom Hook

- [ ] Create custom hook file: `src/hooks/use{{HookName}}.ts`
  - Use template: `templates/hooks/useDAppTemplate.ts`
  - Replace all `{{PLACEHOLDERS}}` with your values
  - Implement all required functions
  - Use `useSafeError` for error handling
  - Test hook functionality

## Step 3: Widget Component

- [ ] Create widget component: `src/components/dapps/{{WidgetName}}.tsx`
  - Use template: `templates/components/DAppWidgetTemplate.tsx`
  - Replace all `{{PLACEHOLDERS}}` with your values
  - Ensure mobile responsiveness
  - Implement dark mode support
  - Test all UI interactions

## Step 4: dApp Registration

- [ ] Add dApp entry to `src/lib/dapps.ts`
  - Add to `placeholderDApps` array
  - Include all required fields:
    - `id`: Unique identifier (string)
    - `name`: Display name
    - `slug`: URL-friendly slug (lowercase, hyphens)
    - `category`: Category ID
    - `utility`: Brief utility description
    - `process`: How to use the dApp
    - `benefits`: Benefits of using the dApp
    - `developer`: Developer name
    - `developerLinks`: Array of developer links
    - `status`: 'Testnet' or 'Mainnet'
    - `network`: Network name
    - `provider`: Provider name
    - `version`: Version string (e.g., '1.0.0')
    - `description`: Full description
    - `security`: Security information
    - `roadmap`: Roadmap information
    - `createdAt`: ISO timestamp
    - `supportedChainIds`: Array of supported chain IDs - **Default: [167012, 19416]** (Kasplex L2 Testnet and Igra Caravel Testnet)
    - `contractAddress`: Contract address (optional, can be fetched from addresses.ts)

## Step 5: Widget Integration

- [ ] Add widget rendering to `src/components/DAppWidget.tsx`
  - Import your widget component
  - Add conditional rendering based on `dapp.slug` or `dapp.id`
  - Follow the pattern of existing widgets (e.g., `DAOVotingWidget`)
  - Include `NetworkCompatibilityModal`
  - Include `DAppWidgetHeader` and `DAppWidgetFooter`
  - Handle network compatibility checks

## Step 6: Testing

### EVM Wallet Connection
- [ ] Test wallet connection with MetaMask
- [ ] Test wallet connection with WalletConnect
- [ ] Test wallet connection with other EVM wallets
- [ ] Verify connection status displays correctly
- [ ] Test disconnect functionality

### Transactions
- [ ] Test all write functions (create, update, delete, etc.)
- [ ] Verify transaction confirmation
- [ ] Test transaction error handling
- [ ] Verify error messages display correctly
- [ ] Test transaction loading states

### Read Functions
- [ ] Test all read functions
- [ ] Verify data displays correctly
- [ ] Test pagination (if applicable)
- [ ] Test refresh functionality
- [ ] Verify loading states

### Mobile Responsiveness
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Verify responsive layouts work correctly
- [ ] Test touch interactions
- [ ] Verify buttons are touch-friendly (min 44x44px)
- [ ] Test menu functionality on mobile
- [ ] Verify text is readable on small screens

### UI/UX
- [ ] Verify dark mode works correctly
- [ ] Test all buttons and interactions
- [ ] Verify loading indicators display
- [ ] Test success/error feedback
- [ ] Verify form validation
- [ ] Test accessibility (keyboard navigation, screen readers)

### Error Handling
- [ ] Test error scenarios (network errors, contract errors, user errors)
- [ ] Verify error messages are user-friendly
- [ ] Test error recovery
- [ ] Verify no console errors

## Step 7: Deployment Verification

- [ ] Verify contract is deployed on target network
- [ ] Verify contract address is correct
- [ ] Test dApp on production/testnet
- [ ] Verify all features work on deployed version
- [ ] Test with multiple wallets
- [ ] Test with different networks

## Step 8: Documentation

- [ ] Update `docs/DAPP_BUILDING_GUIDE.md` with your dApp as an example (optional)
- [ ] Document any special configuration needed
- [ ] Document any known issues or limitations

## Step 9: Final Checks

- [ ] Run linter: `npm run lint`
- [ ] Fix any linting errors
- [ ] Test build: `npm run build`
- [ ] Verify no build errors
- [ ] Test locally: `npm run dev`
- [ ] Verify all features work locally

## Step 10: Deployment

- [ ] Commit all changes
- [ ] Push to repository
- [ ] Verify Vercel deployment succeeds
- [ ] Test deployed version
- [ ] Verify all features work on deployed version

## Notes

- Always use `useSafeError` for error handling to prevent React serialization issues
- Ensure all errors are converted to strings before displaying
- Use mobile-first responsive design
- Follow the DAO Voting dApp pattern for consistency
- Test thoroughly before deploying

