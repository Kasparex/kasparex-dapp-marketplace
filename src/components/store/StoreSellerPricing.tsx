'use client';

import { useStoreListingPricing } from '@/hooks/useStoreListingPricing';
import { StorePricingCards } from '@/components/store/StorePricingCards';

export function StoreSellerPricing({ className = '' }: { className?: string }) {
  const { listingFee, updateFee, archiveFee, tier } = useStoreListingPricing();

  return (
    <StorePricingCards
      listingFee={listingFee}
      updateFee={updateFee}
      archiveFee={archiveFee}
      tier={tier}
      className={className}
    />
  );
}
