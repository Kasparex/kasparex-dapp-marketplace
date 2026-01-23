# Kasparex Store - IPFS-Based Marketplace

## Overview

A simple, optimized digital products marketplace built with **zero database costs**. All data is stored on IPFS and verified on-chain.

## Architecture

### Storage Strategy
- **Product Registry**: Single JSON file on IPFS listing all products
- **Product Data**: Each product has its own JSON file on IPFS
- **Purchase Registry**: JSON file on IPFS tracking all purchases
- **Access Verification**: Checks Kaspa blockchain for purchase transactions

### Key Features
- ✅ Zero database costs (100% IPFS-based)
- ✅ KAS payments with automatic fee calculation
- ✅ Rewards integration (KREX/NFT holder fee discounts)
- ✅ Content restriction for paid products
- ✅ Product submission with 50 KAS listing fee
- ✅ Seller dashboard with revenue/sales tracking
- ✅ L1/L2 network support
- ✅ Mobile-responsive design

## Setup

### Environment Variables

Add these to your `.env.local`:

```env
# Store Configuration
NEXT_PUBLIC_STORE_TREASURY_ADDRESS=your_treasury_address_here
NEXT_PUBLIC_STORE_REGISTRY_CID=  # Will be set automatically when first product is created
NEXT_PUBLIC_STORE_PURCHASES_CID=  # Will be set automatically when first purchase is made

# IPFS (Pinata) - Already configured
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
```

### Initial Setup

1. **First Product**: When the first product is submitted, the registry CID will be generated. You'll need to update `NEXT_PUBLIC_STORE_REGISTRY_CID` with this value.

2. **First Purchase**: When the first purchase is made, the purchase registry CID will be generated. Update `NEXT_PUBLIC_STORE_PURCHASES_CID` with this value.

**Note**: In production, you could automate CID updates via an admin API or store them in a simple config file.

## File Structure

```
src/lib/store/
├── types.ts              # TypeScript types
├── ipfs-registry.ts      # IPFS registry management
├── products.ts           # Product operations
├── purchases.ts          # Purchase tracking
├── fees.ts              # Fee calculation with rewards
├── filtering.ts         # Client-side filtering
└── sorting.ts           # Client-side sorting

src/components/store/
├── ProductCard.tsx           # Product card component
├── ProductPurchase.tsx       # Purchase component
├── ProductSubmissionModal.tsx # Product submission form
└── StoreSidebar.tsx          # Filtering sidebar

src/app/store/
├── page.tsx              # Main listing page
├── [slug]/page.tsx       # Product detail page
└── dashboard/page.tsx     # Seller dashboard

src/app/api/store/
├── registry/route.ts      # Registry management API
└── verify/route.ts       # Purchase verification API
```

## Usage

### For Buyers
1. Browse products on `/store`
2. Filter by category, network, search
3. Click product to view details
4. Purchase with KAS (automatic fee calculation)
5. Access protected content after purchase

### For Sellers
1. Connect wallet
2. Click "Submit Product" on store page
3. Fill form, upload assets to IPFS
4. Pay 50 KAS listing fee
5. Product is listed automatically
6. View dashboard at `/store/dashboard`

## Fee Structure

- **Listing Fee**: 50 KAS (one-time, paid when submitting product)
- **Platform Fee**: 5% base fee (automatically discounted for KREX/NFT holders)
- **Fee Discounts**: Applied automatically based on user's KREX tier and NFT status

## IPFS Registry Pattern

The store uses a registry pattern:
1. **Lightweight Registry**: Contains product summaries (for fast listing)
2. **Full Product Data**: Stored separately on IPFS (loaded on demand)
3. **Purchase Registry**: Tracks all purchases (verified on-chain)

This approach:
- Keeps registry file small (fast loading)
- Allows lazy loading of full product data
- Maintains immutable purchase history
- Zero database costs

## Future Enhancements

The foundation is built for easy expansion:
- Product reviews/ratings
- Advanced analytics
- Bulk product management
- Product categories hierarchy
- Featured products
- Promotional campaigns
