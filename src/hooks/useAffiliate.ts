/**
 * Hook for Affiliate Tracking
 * Auto referral detection and tracking
 */

'use client';

import { useAccount, useReadContract } from 'wagmi';
import { AFFILIATE_MANAGER_ABI } from '@/lib/contracts/abis';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface Referral {
  affiliate: string;
  user: string;
  dAppContract: string;
  timestamp: bigint;
  rewarded: boolean;
}

export interface UseAffiliateResult {
  referralCode: string | null;
  referralCount: number;
  referrals: Referral[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for affiliate tracking
 */
export function useAffiliate(
  affiliateManagerAddress: string | null | undefined,
  dAppContract?: string
): UseAffiliateResult {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Get referral code from URL
  useEffect(() => {
    const ref = searchParams?.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(`referral_${dAppContract || 'default'}`, ref);
      }
    } else if (typeof window !== 'undefined' && dAppContract) {
      // Try to get from localStorage
      const stored = localStorage.getItem(`referral_${dAppContract}`);
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, [searchParams, dAppContract]);

  // Get referral count for this affiliate
  const { data: referralCount, isLoading: isLoadingCount, error: countError, refetch } = useReadContract({
    address: affiliateManagerAddress as `0x${string}`,
    abi: AFFILIATE_MANAGER_ABI,
    functionName: 'getReferralCount',
    args: referralCode && dAppContract ? [referralCode as `0x${string}`, dAppContract as `0x${string}`] : undefined,
    query: {
      enabled: !!referralCode && !!dAppContract && !!affiliateManagerAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  // Get affiliate's referrals
  const { data: referrals, isLoading: isLoadingReferrals } = useReadContract({
    address: affiliateManagerAddress as `0x${string}`,
    abi: AFFILIATE_MANAGER_ABI,
    functionName: 'getAffiliateReferrals',
    args: referralCode ? [referralCode as `0x${string}`] : undefined,
    query: {
      enabled: !!referralCode && !!affiliateManagerAddress,
      refetchInterval: 30000,
    },
  });

  const parsedReferrals: Referral[] = referrals && Array.isArray(referrals)
    ? referrals.map((ref: any) => ({
        affiliate: ref.affiliate || '',
        user: ref.user || '',
        dAppContract: ref.dAppContract || '',
        timestamp: ref.timestamp || BigInt(0),
        rewarded: ref.rewarded || false,
      }))
    : [];

  return {
    referralCode,
    referralCount: referralCount ? Number(referralCount) : 0,
    referrals: parsedReferrals,
    isLoading: isLoadingCount || isLoadingReferrals,
    error: countError as Error | null,
    refetch,
  };
}

