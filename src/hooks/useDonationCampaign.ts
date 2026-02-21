/**
 * Hook to fetch a single donation campaign by creator address (on-chain + IPFS metadata).
 */

import { useMemo } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import type { Address } from 'viem';
import { fetchJSON } from '@/lib/ipfs/gateway';
import type { DonationCampaign, DonationCampaignMetadata } from '@/lib/donations/types';

const ZERO = '0x0000000000000000000000000000000000000000';

export function useDonationCampaign(creatorAddress: string | null): {
  campaign: DonationCampaign | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const chainId = useChainId();
  const escrowAddress = getContractAddress(chainId, 'DonationEscrow');

  const { data: campaignOnChain, isLoading: loadingChain, error: chainError, refetch: refetchChain } = useReadContract({
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'campaigns',
    args: creatorAddress ? [creatorAddress as Address] : undefined,
  });

  const { data: isVerified } = useReadContract({
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'verified',
    args: creatorAddress ? [creatorAddress as Address] : undefined,
  });

  const ipfsHash = useMemo(() => {
    if (!campaignOnChain || Array.isArray(campaignOnChain)) return null;
    const c = campaignOnChain as { creator: string; ipfsHash: string };
    return c.ipfsHash || null;
  }, [campaignOnChain]);

  // We don't have useQuery for IPFS in this hook - parent can fetch metadata or we use a simple fetch in useEffect.
  // For now return campaign without metadata; the page can use fetchJSON(ipfsHash) when ipfsHash is set.
  const campaign: DonationCampaign | null = useMemo(() => {
    if (!creatorAddress || !escrowAddress || !campaignOnChain) return null;
    const c = campaignOnChain as {
      creator: Address;
      targetWei: bigint;
      deadline: bigint;
      raisedWei: bigint;
      donorCount: bigint;
      ipfsHash: string;
      l1Address: string;
      active: boolean;
    };
    if (c.creator === ZERO) return null;
    return {
      creatorAddress: creatorAddress as `0x${string}`,
      targetWei: c.targetWei,
      deadline: c.deadline,
      raisedWei: c.raisedWei,
      donorCount: c.donorCount,
      ipfsHash: c.ipfsHash,
      l1Address: c.l1Address,
      active: c.active,
      verified: Boolean(isVerified),
      metadata: null,
    };
  }, [creatorAddress, escrowAddress, campaignOnChain, isVerified]);

  return {
    campaign,
    isLoading: loadingChain,
    error: chainError ? (chainError as Error) : null,
    refetch: refetchChain,
  };
}

/** Fetch campaign metadata from IPFS by hash */
export async function fetchCampaignMetadata(ipfsHash: string): Promise<DonationCampaignMetadata | null> {
  if (!ipfsHash?.trim()) return null;
  return fetchJSON<DonationCampaignMetadata>(ipfsHash.replace(/^ipfs:\/\//, '').replace(/^\/ipfs\//, ''));
}
