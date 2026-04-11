/**
 * Hook to enumerate donation campaigns (creator addresses + on-chain campaign data).
 * Reads always use Igra Mainnet (38833) so listings work without a connected wallet.
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import type { Address } from 'viem';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

const ZERO = '0x0000000000000000000000000000000000000000';
const MAX_CAMPAIGNS = 100;

// readContract campaigns() returns tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];

export interface DonationCampaignListItem {
  creatorAddress: `0x${string}`;
  /** Set for DonationEscrowV2 rows (card links with ?campaignId=). */
  campaignId?: bigint;
  /** V2 only: on-chain donation method. */
  donationMethod?: 'L2_ESCROW' | 'L1_DIRECT';
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  l1RecordedTotalWei?: bigint;
  l1RecordedDonationCount?: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
  /** V2: Featured placement module unlocked (listing badge). */
  featuredModuleUnlocked?: boolean;
}

function parseL1Bigint(r: { status: string; result?: unknown } | undefined): bigint {
  if (!r || r.status !== 'success' || r.result == null) return 0n;
  return r.result as bigint;
}

export function useDonationCampaigns(): {
  campaigns: DonationCampaignListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const escrowAddress = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrow') as Address | undefined;

  const { data: countBig, isLoading: loadingCount, refetch: refetchCount } = useReadContract({
    chainId: CROWDKAS_CHAIN_ID,
    address: escrowAddress,
    abi: DONATION_ESCROW_ABI,
    functionName: 'getCreatorCount',
  });

  const creatorCount = countBig != null ? Math.min(Number(countBig), MAX_CAMPAIGNS) : 0;

  const creatorAtConfigs = useMemo(
    () =>
      creatorCount > 0 && escrowAddress
        ? Array.from({ length: creatorCount }, (_, i) => ({
            chainId: CROWDKAS_CHAIN_ID,
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
    allowFailure: true,
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
            chainId: CROWDKAS_CHAIN_ID,
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
    allowFailure: true,
  });

  const baseCampaigns: Omit<DonationCampaignListItem, 'l1RecordedTotalWei' | 'l1RecordedDonationCount'>[] = useMemo(() => {
    if (!campaignResults || !Array.isArray(campaignResults)) return [];
    const list: Omit<DonationCampaignListItem, 'l1RecordedTotalWei' | 'l1RecordedDonationCount'>[] = [];
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

  const l1TotalConfigs = useMemo(
    () =>
      baseCampaigns.length > 0 && escrowAddress
        ? baseCampaigns.flatMap((c) => [
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: escrowAddress,
              abi: DONATION_ESCROW_ABI,
              functionName: 'l1RecordedTotalWei' as const,
              args: [c.creatorAddress as Address] as const,
            },
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: escrowAddress,
              abi: DONATION_ESCROW_ABI,
              functionName: 'l1RecordedDonationCount' as const,
              args: [c.creatorAddress as Address] as const,
            },
          ])
        : [],
    [baseCampaigns, escrowAddress]
  );

  const { data: l1Results, isLoading: loadingL1, refetch: refetchL1 } = useReadContracts({
    contracts: l1TotalConfigs,
    allowFailure: true,
    query: { enabled: l1TotalConfigs.length > 0 },
  });

  const campaigns: DonationCampaignListItem[] = useMemo(() => {
    if (baseCampaigns.length === 0) return [];
    if (!l1Results || l1Results.length !== baseCampaigns.length * 2) {
      return baseCampaigns.map((c) => ({ ...c, l1RecordedTotalWei: 0n, l1RecordedDonationCount: 0n }));
    }
    return baseCampaigns.map((c, i) => {
      const totalIdx = i * 2;
      const countIdx = i * 2 + 1;
      return {
        ...c,
        l1RecordedTotalWei: parseL1Bigint(l1Results[totalIdx]),
        l1RecordedDonationCount: parseL1Bigint(l1Results[countIdx]),
      };
    });
  }, [baseCampaigns, l1Results]);

  const refetch = () => {
    refetchCount();
    refetchCampaigns();
    refetchL1();
  };

  return {
    campaigns,
    isLoading: loadingCount || loadingCreators || loadingCampaigns || (baseCampaigns.length > 0 && loadingL1),
    error: null,
    refetch,
  };
}
