'use client';

import { useEffect } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';

interface ReferralTrackerProps {
  contentType: RevenueTreeContentType;
  contentSlug: string;
  issueNumber?: number;
}

/**
 * Client component to track referrals from URL parameters
 * This component doesn't render anything, it just handles referral tracking
 */
export function ReferralTracker({ contentType, contentSlug, issueNumber }: ReferralTrackerProps) {
  const { referrerAddress, hasReferral } = useReferral({
    contentType,
    contentSlug,
    autoStore: true,
  });

  useEffect(() => {
    if (hasReferral && referrerAddress) {
      // Referral is automatically stored by the hook
      // You can add additional tracking logic here (analytics, etc.)
      console.log(`Referral tracked: ${referrerAddress} for ${contentType}/${contentSlug}`);
    }
  }, [hasReferral, referrerAddress, contentType, contentSlug]);

  // This component doesn't render anything
  return null;
}
