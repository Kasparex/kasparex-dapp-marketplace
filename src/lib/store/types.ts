/**
 * Kasparex Store Types
 * IPFS-based product marketplace types
 */

export type ProductNetwork = 'L1' | 'L2';
export type ProductStatus = 'active' | 'archived';
export type ProductCategory = 'Software' | 'Art' | 'Music' | 'Templates' | 'Other';

export interface Product {
  id: string; // UUID
  slug: string; // URL-friendly identifier
  title: string;
  description: string;
  content?: string; // Protected content (only for buyers)
  sellerAddress: string;
  priceKAS: number;
  network: ProductNetwork;
  category: ProductCategory;
  assetCids: string[]; // IPFS CIDs for product files
  thumbnailCid: string; // IPFS CID for thumbnail image
  status: ProductStatus;
  listingFeePaid: boolean;
  createdAt: number; // Timestamp
  purchaseCount: number;
}

export interface ProductRegistryEntry {
  id: string;
  slug: string;
  productCid: string; // CID of full product data JSON
  thumbnailCid: string;
  sellerAddress: string;
  priceKAS: number;
  network: ProductNetwork;
  category: ProductCategory;
  status: ProductStatus;
  createdAt: number;
  purchaseCount: number;
}

export interface ProductRegistry {
  registryCid?: string; // Self-reference
  updatedAt: number;
  products: ProductRegistryEntry[];
}

export interface Purchase {
  id: string; // UUID
  productId: string;
  buyerAddress: string;
  txHash: string;
  amountPaidKAS: number;
  platformFeeKAS: number;
  sellerRevenueKAS: number;
  purchasedAt: number;
}

export interface PurchaseRegistry {
  registryCid?: string; // Self-reference
  updatedAt: number;
  purchases: Purchase[];
}

export interface FeeCalculation {
  feePercent: number;
  feeAmount: number;
  sellerRevenue: number;
  totalAmount: number;
}

export interface SellerStats {
  totalRevenue: number;
  totalSales: number;
  products: Array<{
    id: string;
    title: string;
    priceKAS: number;
    purchaseCount: number;
    status: ProductStatus;
  }>;
  recentSales: Purchase[];
}
