/**
 * Re-export Chronicles entitlements for reuse by other dApp surfaces later
 * (token gates, NFT unlocks, shared dashboard patterns).
 */
export type {
  ChroniclesContentId,
  EntitlementOffer,
  EntitlementOfferKind,
  EntitlementsCatalogFile,
  EntitlementsMockFile,
} from '@/lib/chronicles/entitlements/types';
export { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
