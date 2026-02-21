/**
 * Hook to enumerate donation campaigns (creator addresses + on-chain campaign data).
 * Reads getCreatorCount then creatorAt(0)..creatorAt(n-1), then campaigns(creator) for each.
 */

import { useMemo } from 'react';
import { useChainId, useReadContract, useReadContracts } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import type { Address } from 'viem';

const ZERO = '0x0000000000000000000000000000000000000000';
const MAX_CAMPAIGNS = 100;

export interface DonationCampaignListItem {
  creatorAddress: `0x${string}`;
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
}

export function useDonationCampaigns(): {
  campaigns: DonationCampaignListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const chainId = useChainId();
  const escrowAddress = getContractAddress(chainId, 'DonationEscrow') as Address | undefined;

  const { data: countBig, isLoading: loadingCount, refetch: refetchCount } = useReadContract({
    address: escrowAddress,
    abi: DONATION_ESCROW_ABI,
    functionName: 'getCreatorCount',
  });

  const creatorCount = countBig != null ? Math.min(Number(countBig), MAX_CAMPAIGNS) : 0;

  const creatorAtConfigs = useMemo(
    () =>
      creatorCount > 0 && escrowAddress
        ? Array.from({ length: creatorCount }, (_, i) => ({
            address: escrowAddress,
            abi: DONATION_ESCROW_ABI,
            functionName: 'creatorAt' as const,
            args: [BigInt(i)] as const,
          }))
        : [],
    [creatorCount, escrowAddress]
  );

  const { data: creatorResults, isLoading: loadingCreators } = useReadContracts({
    contracts: creatorAtConfigs,
  });

  const creatorAddresses = useMemo(() => {
    if (!creatorResults || !Array.isArray(creatorResults)) return [];
    return creatorResults
      .map((r) => (r.status === 'success' && r.result ? (r.result as Address) : null))
      .filter((a): a is Address => a != null && a !== ZERO);
  }, [creatorResults]);

  const campaignReadConfigs = useMemo(
    () =>
      creatorAddresses.length > 0 && escrowAddress
        ? creatorAddresses.map((addr) => ({
            address: escrowAddress,
            abi: DONATION_ESCROW_ABI,
            functionName: 'campaigns' as const,
            args: [addr] as const,
          }))
        : [],
    [creatorAddresses, escrowAddress]
  );

  const { data: campaignResults, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useReadContracts({
    contracts: campaignReadConfigs,
  });

  const campaigns: DonationCampaignListItem[] = useMemo(() => {
    if (!campaignResults || !Array.isArray(campaignResults)) return [];
    const list: DonationCampaignListItem[] = [];
    campaignResults.forEach((r, i) => {
      if (r.status !== 'success' || !r.result || i >= creatorAddresses.length) return;
      const c = r.result as { creator: string; targetWei: bigint; deadline: bigint; raisedWei: bigint; donorCount: bigint; ipfsHash: string; l1Address: string; active: boolean };
      if (c.creator === ZERO) return;
      list.push({
        creatorAddress: creatorAddresses[i] as `0x${string}`,
        targetWei: c.targetWei,
        deadline: c.deadline,
        raisedWei: c.raisedWei,
        donorCount: c.donorCount,
        ipfsHash: c.ipfsHash,
        l1Address: c.l1Address,
        active: c.active,
      });
    });
    return list;
  }, [campaignResults, creatorAddresses]);

  const refetch = () => {
    refetchCount();
    refetchCampaigns();
  };

  return {
    campaigns,
    isLoading: loadingCount || loadingCreators || loadingCampaigns,
    error: null,
    refetch,
  };
}
