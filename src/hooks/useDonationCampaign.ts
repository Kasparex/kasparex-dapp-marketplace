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

// readContract returns tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];

function parseCampaign(data: unknown): CampaignTuple | null {
  const t = data as unknown as CampaignTuple | undefined;
  if (!t || t[0] === ZERO) return null;
  return t;
}

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

  const campaign: DonationCampaign | null = useMemo(() => {
    if (!creatorAddress || !escrowAddress) return null;
    const t = parseCampaign(campaignOnChain);
    if (!t) return null;
    return {
      creatorAddress: creatorAddress as `0x${string}`,
      targetWei: t[1],
      deadline: t[2],
      raisedWei: t[3],
      donorCount: t[4],
      ipfsHash: t[5],
      l1Address: t[6],
      active: t[7],
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
