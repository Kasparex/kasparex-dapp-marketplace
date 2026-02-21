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

// readContract campaigns() returns tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];

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
      const t = r.result as unknown as CampaignTuple;
      if (t[0] === ZERO) return;
      list.push({
        creatorAddress: creatorAddresses[i] as `0x${string}`,
        targetWei: t[1],
        deadline: t[2],
        raisedWei: t[3],
        donorCount: t[4],
        ipfsHash: t[5],
        l1Address: t[6],
        active: t[7],
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
