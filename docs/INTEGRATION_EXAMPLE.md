# Integration Example: Updating DAppCard to Use Icons

## Before (Image-based)

```tsx
{dapp.image ? (
  <div className="flex-shrink-0 relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
    <Image
      src={mergedDApp.image || dapp.image || ''}
      alt={mergedDApp.name}
      fill
      className="object-cover"
      unoptimized
    />
  </div>
) : (
  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
    <span className="text-2xl">{category?.emoji || '⚡'}</span>
  </div>
)}
```

## After (Icon-based)

```tsx
import { DAppIcon } from '@/components/dapps/DAppIcon';

// Replace the image section with:
<DAppIcon
  dAppName={mergedDApp.name}
  category={mergedDApp.category}
  size={48}
  className="flex-shrink-0"
/>
```

## Full Example: DAppDetail with Token Components

```tsx
import { DAppIcon } from '@/components/dapps/DAppIcon';
import { TokenDisplay } from '@/components/dapps/TokenDisplay';
import { ProofOfUtility } from '@/components/dapps/ProofOfUtility';
import { RewardsDisplay } from '@/components/dapps/RewardsDisplay';
import { AffiliateWidget } from '@/components/dapps/AffiliateWidget';
import { useDAppFromContract } from '@/lib/dapps/contractData';

export function DAppDetail({ dapp }: DAppDetailProps) {
  const { data: contractData } = useDAppFromContract(dapp.contractAddress, chainId);
  
  return (
    <div className="space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center gap-4">
        <DAppIcon
          dAppName={dapp.name}
          category={dapp.category}
          size={64}
        />
        <div>
          <h1>{dapp.name}</h1>
          <p>{dapp.description}</p>
        </div>
      </div>

      {/* Token Information */}
      {contractData?.tokenAddress && (
        <TokenDisplay
          tokenAddress={contractData.tokenAddress}
          ticker={contractData.ticker || 'TKN'}
          totalSupply={contractData.totalSupply?.toString() || '0'}
          dAppName={dapp.name}
        />
      )}

      {/* Proof of Utility */}
      {proofOfUtilityAddress && (
        <ProofOfUtility
          proofOfUtilityAddress={proofOfUtilityAddress}
        />
      )}

      {/* Rewards */}
      <RewardsDisplay
        gridTokenAddress={gridTokenAddress}
        dAppTokenAddress={contractData?.tokenAddress}
        ticker={contractData?.ticker}
      />

      {/* Affiliate Widget */}
      <AffiliateWidget
        dAppId={dapp.id}
        dAppName={dapp.name}
      />
    </div>
  );
}
```

## Environment Variables Needed

Create `.env.local`:

```env
# Pinata IPFS
# Get your API keys from https://app.pinata.cloud/
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_api_secret

# Contract Addresses (update after deployment)
NEXT_PUBLIC_GRID_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_PROOF_OF_UTILITY_ADDRESS=0x...
NEXT_PUBLIC_REWARD_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_FEE_HANDLER_ADDRESS=0x...
NEXT_PUBLIC_AFFILIATE_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_USER_PROFILE_DASHBOARD_ADDRESS=0x...
NEXT_PUBLIC_ADMIN_DASHBOARD_ADDRESS=0x...
NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS=0x...
```

