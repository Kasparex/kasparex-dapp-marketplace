'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculateDirectoryListingFeeKas } from '@/lib/dapps/listingSubmissions';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { STORE_LISTING_FEE_KAS, STORE_UPDATE_FEE_KAS } from '@/lib/store/listingQuote';

export function useStoreListingPricing() {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(STORE_LISTING_FEE_KAS, tier, nftStatus).effectiveKas,
    [tier, nftStatus],
  );
  const updateFee = useMemo(
    () => calculateDirectoryListingFeeKas(STORE_UPDATE_FEE_KAS, tier, nftStatus).effectiveKas,
    [tier, nftStatus],
  );
  const archiveFee = useMemo(
    () => calculateDirectoryListingFeeKas(HUB_DELETE_FEE_KAS.store, tier, nftStatus).effectiveKas,
    [tier, nftStatus],
  );

  return { listingFee, updateFee, archiveFee, tier };
}
