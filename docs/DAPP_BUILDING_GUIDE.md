# dApp Building Guide

Complete guide for building, integrating, implementing, and deploying dApps in the Kasparex ecosystem.

## Overview

This guide walks you through the entire process of creating a new dApp, from smart contract development to frontend integration and deployment. The template system ensures consistency, proper error handling, EVM wallet integration, and mobile responsiveness.

**Key Features:**
- **Automated Build Process**: Fill in the dApp description section, and the system handles planning and building
- **Default Configurations**: Standard defaults included (1% fee, supported networks, etc.)
- **Multi-Network Support**: Deploy to both Kasplex L2 Testnet (167012) and Igra Caravel Testnet (19416)
- **Mobile-First**: Responsive design built-in
- **vProgs Ready**: Prepared for future vProgs integration

## Prerequisites

### Required Knowledge
- Solidity smart contract development
- React/Next.js frontend development
- TypeScript
- Hardhat for contract deployment
- Basic understanding of wagmi/viem for EVM interactions

### Required Tools
- Node.js 18+ and npm
- Hardhat
- MetaMask or other EVM wallet
- Git
- Code editor (VS Code recommended)

### Required Accounts
- GitHub account (for repository access)
- Vercel account (for deployment)
- Testnet KAS for gas fees

## Step-by-Step Process

### Step 1: Fill Out the Template

1. Open `docs/DAPP_TEMPLATE.md`
2. **Start with the "dApp Description" section at the beginning** - This is used during the automated build process
   - Fill in what you know about your dApp
   - Describe what it does, what problem it solves, who it's for
   - List key features and user flow
   - The system will handle planning and building based on this
3. Fill in all other `{{FIELD_NAME}}` placeholders:
   - Basic information (name, description, category)
   - Smart contract details
   - Frontend widget requirements
   - Custom hook specifications
   - Deployment configuration
   - **Note**: Default values are provided where possible (1% fee, supported networks, etc.)

### Step 2: Select Ecosystem Contracts

1. Review the **Ecosystem Integration** section in `docs/DAPP_TEMPLATE.md`
2. Check/uncheck boxes to select which contracts to integrate:
   - **Default**: DAppRegistry, FeeCollector, ProofOfUtility, RewardManager (recommended for most dApps)
   - **Optional**: FeeHandler, AffiliateManager, LoyaltyPoints, ProfileRegistry, etc.
3. Note your selections - they will be used in the deployment script

### Step 3: Create Smart Contract

1. Copy `templates/contracts/DAppTemplate.sol` to `contracts/YourContract.sol`
2. Replace all `{{PLACEHOLDERS}}` with your values
3. **Default configurations are already included:**
   - Default fee percentage: 1% (100 basis points)
   - Default pagination: 50 items per page
   - Default transaction timeout: 5 minutes
   - ReentrancyGuard enabled by default
   - Default ecosystem integration: FeeCollector, ProofOfUtility
4. Implement your contract logic:
   - Define state variables
   - Implement write functions
   - Implement read functions
   - Add events
   - Add admin functions
5. Configure ecosystem integration based on your selections:
   - Uncomment contracts you selected in Step 2
   - Comment out contracts you didn't select
   - Default: FeeCollector + ProofOfUtility (for rewards)
6. Test your contract locally with Hardhat

### Step 4: Create Custom Hook

1. Copy `templates/hooks/useDAppTemplate.ts` to `src/hooks/useYourHook.ts`
2. Replace all `{{PLACEHOLDERS}}` with your values
3. Implement hook functions:
   - Use `useWriteContract` for write operations
   - Use `useReadContract` for read operations
   - Use `useSafeError` for error handling
   - Implement data loading logic
   - Add refresh mechanisms
4. Define TypeScript interfaces for your data structures
5. Test hook functionality

### Step 5: Create Widget Component

1. Copy `templates/components/DAppWidgetTemplate.tsx` to `src/components/dapps/YourWidget.tsx`
2. Replace all `{{PLACEHOLDERS}}` with your values
3. Implement UI components:
   - Header with title and description
   - Forms for user input
   - Lists/tables for data display
   - Action buttons
   - Loading indicators
   - Error/success messages
4. Ensure mobile responsiveness:
   - Use responsive Tailwind classes (`sm:`, `md:`, `lg:`)
   - Test on mobile devices
   - Ensure touch-friendly buttons (min 44x44px)
5. Implement dark mode support
6. Test all UI interactions

### Step 6: Add Contract ABI

1. Open `src/lib/contracts/abis.ts`
2. Add your contract ABI:
   ```typescript
   export const YOUR_CONTRACT_ABI = [
     "function yourFunction(...) external ...",
     "event YourEvent(...)",
     // ... all your functions and events
   ] as const;
   ```
3. Follow the pattern of existing ABIs (e.g., `DAO_VOTING_ABI`)

### Step 7: Add Contract Address

1. Open `src/lib/contracts/addresses.ts`
2. Add your contract address to `HARDCODED_FALLBACK_ADDRESSES` for each network:
   ```typescript
   kasplexL2Testnet: {
     YourContract: "0x...", // Kasplex L2 Testnet (Chain ID: 167012)
     // ...
   },
   igraCaravelTestnet: {
     YourContract: "0x...", // Igra Caravel Testnet (Chain ID: 19416)
     // ...
   },
   kasplexL2Mainnet: {
     YourContract: "0x...", // Kasplex L2 Mainnet (Chain ID: 202555) - if deploying
     // ...
   },
   ```
3. Add to `DEFAULT_CONTRACT_ADDRESSES` as well
4. **Recommended**: Deploy to both Kasplex L2 Testnet and Igra Caravel Testnet for maximum compatibility

### Step 8: Register dApp

1. Open `src/lib/dapps.ts`
2. Add your dApp to the `placeholderDApps` array
3. Include all required fields (see template)
4. Use a unique `id` (string)
5. Set `slug` to URL-friendly format (lowercase, hyphens)

### Step 9: Integrate Widget

1. Open `src/components/DAppWidget.tsx`
2. Import your widget component
3. Add conditional rendering:
   ```typescript
   if (dapp.slug === 'your-dapp-slug') {
     return (
       <>
         <NetworkCompatibilityModal ... />
         <div className="...">
           <DAppWidgetHeader ... />
           <YourWidget />
           <DAppWidgetFooter ... />
         </div>
       </>
     );
   }
   ```
4. Follow the pattern of existing widgets

### Step 9: Deploy Contracts

1. Copy `templates/scripts/deploy-dapp-template.js` to `scripts/deploy-your-dapp.js`
2. Replace all `{{PLACEHOLDERS}}` with your values
3. Set up environment variables in `.env`:
   ```
   FEE_COLLECTOR_ADDRESS=0x...
   DAPP_REGISTRY_ADDRESS=0x...
   PROOF_OF_UTILITY_ADDRESS=0x...  # Required for reward tracking
   FEE_PERCENTAGE=100  # Optional: Default is 100 (1%)
   ```
4. Run deployment to Kasplex L2 Testnet:
   ```bash
   npx hardhat run scripts/deploy-your-dapp.js --network kasplexL2Testnet
   ```
5. Run deployment to Igra Caravel Testnet (when ecosystem contracts are available):
   ```bash
   npx hardhat run scripts/deploy-your-dapp.js --network igraCaravelTestnet
   ```
   **Note:** Igra Caravel Testnet deployment requires ecosystem contracts to be deployed first.
6. Save contract addresses for both networks
7. Update `src/lib/contracts/addresses.ts` with deployed addresses for both networks

### Step 11: Configure RewardManager

After deploying your dApp, configure RewardManager for automatic reward distribution:

1. Create configuration script (copy from template):
   ```bash
   cp scripts/configure-quiz-to-earn-rewards.js scripts/configure-your-dapp-rewards.js
   ```

2. Update the script with your dApp contract address

3. Configure with default settings (1% rate, GRID token):
   ```bash
   npx hardhat run scripts/configure-your-dapp-rewards.js --network kasplexL2Testnet
   ```

4. Or use custom settings:
   ```bash
   REWARD_RATE=200 USE_GRID=false DAPP_TOKEN_ADDRESS=0x... \
   npx hardhat run scripts/configure-your-dapp-rewards.js --network kasplexL2Testnet
   ```

**Standard Default Settings:**
- **Reward Rate**: 100 basis points (1%)
- **Reward Type**: GRID Token (default)
- **Reward Calculation**: Action Value × Reward Rate

**Common Reward Rates:**
- Small actions (tips, votes, quizzes): 50-200 basis points (0.5-2%)
- Medium actions (payments, subscriptions): 100-500 basis points (1-5%)
- Large actions (trades, deposits): 10-100 basis points (0.1-1%)

### Step 12: Test Thoroughly

Follow the testing checklist in `templates/integration-checklist.md`:

- [ ] Test EVM wallet connection
- [ ] Test all transactions
- [ ] Test all read functions
- [ ] Test mobile responsiveness
- [ ] Test error handling
- [ ] Test dark mode
- [ ] Test on different networks
- [ ] Test with different wallets

## Best Practices

### UI/UX

1. **Mobile-First Design**
   - Start with mobile layout, then enhance for larger screens
   - Use responsive Tailwind classes
   - Test on real devices, not just browser dev tools

2. **Consistent Styling**
   - Use accent color: `#02abb8`
   - Follow existing component patterns
   - Maintain consistent spacing and typography

3. **Loading States**
   - Show loading indicators during transactions
   - Disable buttons while processing
   - Provide clear feedback

4. **Error Handling**
   - Always use `useSafeError` for error conversion
   - Display user-friendly error messages
   - Provide recovery options when possible

5. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels where needed
   - Ensure keyboard navigation works
   - Test with screen readers

### Error Handling

1. **Always Convert Errors**
   ```typescript
   const safeError = useSafeError(rawError);
   ```
   This prevents React serialization issues with function-type errors.

2. **User-Friendly Messages**
   - Don't show raw error objects
   - Provide actionable error messages
   - Guide users on how to fix issues

3. **Transaction Errors**
   - Handle user rejection gracefully
   - Show network errors clearly
   - Provide retry options

### Security

1. **Smart Contracts**
   - Use OpenZeppelin contracts when possible
   - Implement ReentrancyGuard for payable functions
   - Validate all inputs
   - Use SafeMath or Solidity 0.8+ overflow protection

2. **Frontend**
   - Validate user inputs
   - Sanitize data before sending to contracts
   - Handle edge cases
   - Don't expose private keys or sensitive data

### Performance

1. **Contract Calls**
   - Batch read operations when possible
   - Use pagination for large datasets
   - Cache data when appropriate

2. **Frontend**
   - Use React.memo for expensive components
   - Lazy load components when possible
   - Optimize images and assets

## Troubleshooting

### Common Issues

1. **"Cannot use 'in' operator" Error**
   - Ensure all errors use `useSafeError`
   - Check that errors are converted before React renders
   - Verify `SafeMutationCache` is configured in `Providers.tsx`

2. **Wallet Connection Issues**
   - Check network compatibility
   - Verify chain ID is correct
   - Ensure wallet is unlocked
   - Check browser console for errors

3. **Transaction Failures**
   - Verify sufficient balance for gas
   - Check contract address is correct
   - Verify function parameters are correct
   - Check contract state (e.g., paused, access control)

4. **Mobile Layout Issues**
   - Check responsive Tailwind classes
   - Verify viewport meta tag
   - Test on real devices
   - Check for overflow issues

5. **Build Errors**
   - Run `npm run lint` to find issues
   - Check TypeScript errors
   - Verify all imports are correct
   - Check for missing dependencies

### Getting Help

1. Check existing dApps for examples (DAO Voting, Simple Payment)
2. Review template files for patterns
3. Check documentation in `docs/` folder
4. Review error messages carefully
5. Check browser console for detailed errors

## Examples

### Reference Implementations

1. **DAO Voting dApp** - Complete example with:
   - Smart contract with fee handling
   - Custom hook with pagination
   - Widget with forms and lists
   - Full integration

2. **Simple Payment dApp** - Simpler example with:
   - Basic contract
   - Simple hook
   - Basic widget

### Template Files

All templates are in the `templates/` directory:
- `contracts/DAppTemplate.sol` - Smart contract template
- `hooks/useDAppTemplate.ts` - Custom hook template
- `components/DAppWidgetTemplate.tsx` - Widget component template
- `scripts/deploy-dapp-template.js` - Deployment script template

## vProgs Integration

### Preparation

When vProgs support is added, your dApp will be compatible if you:

1. Use standard Solidity patterns
2. Avoid EVM-specific features
3. Use network abstraction layer (when available)
4. Standardize contract interfaces
5. Follow template structure

### Notes

- Comments in templates indicate vProgs compatibility points
- Network abstraction will handle EVM/vProgs differences
- Contract interfaces should remain consistent

## Next Steps

After completing your dApp:

1. Test thoroughly on testnet
2. Get feedback from users
3. Fix any issues
4. Deploy to mainnet (when ready)
5. Monitor usage and performance
6. Iterate and improve

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

