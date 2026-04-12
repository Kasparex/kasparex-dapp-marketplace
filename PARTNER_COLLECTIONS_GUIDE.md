# Partner/Collaboration NFT Collections Guide

This guide explains how to add partner/collaboration NFT collections to the Kasparex reward system.

## Overview

The system supports partner/collaboration NFT collections that can be integrated into the reward system. Partner collections are treated similarly to KREXPRIME and PIXELKREX collections but can have their own configuration.

## Adding a Partner Collection

### Step 1: Add Collection Configuration

Edit `src/lib/nft/collections.ts` and add your partner collection:

```typescript
export const collections: Record<string, CollectionConfig> = {
  // ... existing collections ...
  
  PARTNER_COLLECTION_NAME: {
    id: 'PARTNER_COLLECTION_NAME',
    name: 'Partner Collection Name',
    slug: 'PARTNER_COLLECTION_NAME',
    deployer: 'kaspa:...', // Partner collection deployer address
    baseUri: 'ipfs://...', // IPFS base URI for metadata
    kaspaComUrl: 'https://www.kaspa.com/nft/collections/PARTNER_COLLECTION_NAME',
    description: 'Partner collection description',
    isPartnerCollection: true, // Mark as partner collection
    partnerName: 'Partner Project Name', // Optional: partner project name
  },
};
```

### Step 2: Update NFT Status Interface (Future Enhancement)

The current `NFTStatus` interface in `src/lib/rewards/types.ts` is hardcoded for KREXPRIME and PIXELKREX. To fully support partner collections, you would need to:

1. Update `NFTStatus` interface to include partner collections dynamically
2. Update `computeNFTStatus` in `src/lib/nft/status.ts`
3. Update `useNFTStatus` hooks to query partner collections
4. Update `NFTStatusBox` component to display partner collections
5. Update reward calculator to include partner collections in calculations

### Step 3: Update NFT Query Functions

Partner collections should be included in the `queryL1NFTs` and `queryL2NFTs` functions in `src/lib/nft/nft-query.ts` by adding the collection ID to the `collectionIds` array.

### Step 4: Update Diamond Detection (if applicable)

If partner collections have Diamond NFTs, update `src/lib/nft/diamond-detection.ts` to handle the partner collection's Diamond detection logic.

## Points System Integration

NFTs grant points based on their tier:
- **Regular NFT**: 1 point
- **Diamond NFT**: 5 points  
- **Rarest NFT**: 10 points

The points calculation function is in `src/lib/nft/points.ts`:

```typescript
import { calculateNFTPoints } from '@/lib/nft/points';

const points = calculateNFTPoints(nftStatus);
```

## Current Limitations

The current implementation has partner collection infrastructure in place, but the NFT Status interface and UI components are still hardcoded for KREXPRIME and PIXELKREX. To fully enable partner collections, a refactor would be needed to make the system more dynamic.

## Future Enhancements

To make the system fully dynamic and support unlimited partner collections:

1. Refactor `NFTStatus` to use a map/dynamic structure
2. Update all NFT status checking code to iterate over collections dynamically
3. Make the NFT Status box render collections dynamically
4. Update reward calculations to work with dynamic collections
5. Add partner collection configuration UI (admin panel)

## Notes

- Partner collections work the same as regular collections for NFT querying
- Points calculation currently only works for KREXPRIME and PIXELKREX
- Partner collections will appear in the "My NFTs" tab if added to collection queries
- Reward multipliers currently only apply to KREXPRIME and PIXELKREX
