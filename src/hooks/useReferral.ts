'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';
import { getReferralFromUrl, storeReferral, getStoredReferral } from '@/lib/revenue-tree/referral';

interface UseReferralOptions {
  contentType: RevenueTreeContentType;
  contentSlug: string;
  autoStore?: boolean;
}

/**
 * Hook to handle referral tracking from URL parameters
 */
export function useReferral({ contentType, contentSlug, autoStore = true }: UseReferralOptions) {
  const searchParams = useSearchParams();
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for referral parameter
    const urlReferral = searchParams?.get('ref');
    
    if (urlReferral) {
      setReferrerAddress(urlReferral);
      
      // Auto-store if enabled
      if (autoStore) {
        storeReferral(urlReferral, contentType, contentSlug);
      }
    } else {
      // Check localStorage for stored referral
      const storedReferral = getStoredReferral(contentType, contentSlug);
      if (storedReferral) {
        setReferrerAddress(storedReferral);
      }
    }
  }, [searchParams, contentType, contentSlug, autoStore]);

  return {
    referrerAddress,
    hasReferral: referrerAddress !== null,
  };
}
