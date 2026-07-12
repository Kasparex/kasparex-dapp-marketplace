/**
 * Hook to fetch all campaigns for a creator from DonationEscrowV2.
 * Uses Igra Mainnet reads (38833) so it can render even if the wallet is on another chain.
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import type { DonationCampaignV2ListItem, DonationMethodV2 } from '@/hooks/useDonationCampaignsV2';
import { filterTombstonedV2Campaigns } from '@/lib/donations/tombstoneCampaigns';

type CampaignV2Tuple = readonly [
  bigint,
  Address,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  string,
  boolean
];

function parseMethod(m: bigint): DonationMethodV2 {
  return m === 1n ? 'L1_DIRECT' : 'L2_ESCROW';
}

function parseBigintResult(r: { status: string; result?: unknown } | undefined): bigint {
  if (!r || r.status !== 'success' || r.result == null) return 0n;
  return r.result as bigint;
}

export function useMyDonationCampaignsV2(creatorAddress: Address | undefined): {
  campaigns: DonationCampaignV2ListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const escrowV2Address = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2') as Address | undefined;

  const { data: countBig, isLoading: loadingCount, error: countError, refetch: refetchCount } = useReadContract({
    chainId: CROWDKAS_CHAIN_ID,
    address: escrowV2Address,
    abi: DONATION_ESCROW_V2_ABI,
    functionName: 'getCreatorCampaignCount',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: Boolean(escrowV2Address && creatorAddress) },
  });

  const creatorCount = countBig != null ? Number(countBig) : 0;

  const idReadConfigs = useMemo(
    () =>
      creatorCount > 0 && escrowV2Address && creatorAddress
        ? Array.from({ length: creatorCount }, (_, i) => ({
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowV2Address,
            abi: DONATION_ESCROW_V2_ABI,
            functionName: 'creatorCampaignIdAt' as const,
            args: [creatorAddress, BigInt(i)] as const,
          }))
        : [],
    [creatorCount, escrowV2Address, creatorAddress]
  );

  const { data: idResults, isLoading: loadingIds, refetch: refetchIds } = useReadContracts({
    contracts: idReadConfigs,
    allowFailure: true,
    query: { enabled: idReadConfigs.length > 0 },
  });

  const campaignIds = useMemo(() => {
    if (!idResults || !Array.isArray(idResults)) return [];
    return idResults
      .map((r) => (r.status === 'success' && r.result != null ? (r.result as bigint) : null))
      .filter((x): x is bigint => x != null && x > 0n);
  }, [idResults]);

  const campaignReadConfigs = useMemo(
    () =>
      campaignIds.length > 0 && escrowV2Address
        ? campaignIds.map((id) => ({
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowV2Address,
            abi: DONATION_ESCROW_V2_ABI,
            functionName: 'campaignsById' as const,
            args: [id] as const,
          }))
        : [],
    [campaignIds, escrowV2Address]
  );

  const { data: campaignResults, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useReadContracts({
    contracts: campaignReadConfigs,
    allowFailure: true,
    query: { enabled: campaignReadConfigs.length > 0 },
  });

  const baseCampaigns = useMemo(() => {
    if (!campaignResults || !Array.isArray(campaignResults)) return [];
    const list: DonationCampaignV2ListItem[] = [];
    campaignResults.forEach((r, i) => {
      if (r.status !== 'success' || !r.result || i >= campaignIds.length) return;
      const t = r.result as unknown as CampaignV2Tuple;
      list.push({
        campaignId: campaignIds[i],
        creatorAddress: t[1] as `0x${string}`,
        method: parseMethod(t[2]),
        targetWei: t[3],
        deadline: t[4],
        raisedWei: t[5],
        donorCount: t[6],
        ipfsHash: t[7],
        l1Address: t[8],
        active: t[9],
      });
    });
    return list;
  }, [campaignResults, campaignIds]);

  const l1TotalsConfigs = useMemo(
    () =>
      baseCampaigns.length > 0 && escrowV2Address
        ? baseCampaigns.flatMap((c) => [
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: escrowV2Address,
              abi: DONATION_ESCROW_V2_ABI,
              functionName: 'l1RecordedTotalWei' as const,
              args: [c.campaignId] as const,
            },
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: escrowV2Address,
              abi: DONATION_ESCROW_V2_ABI,
              functionName: 'l1RecordedDonationCount' as const,
              args: [c.campaignId] as const,
            },
          ])
        : [],
    [baseCampaigns, escrowV2Address]
  );

  const { data: l1Results, isLoading: loadingL1, refetch: refetchL1 } = useReadContracts({
    contracts: l1TotalsConfigs,
    allowFailure: true,
    query: { enabled: l1TotalsConfigs.length > 0 },
  });

  const campaigns: DonationCampaignV2ListItem[] = useMemo(() => {
    if (baseCampaigns.length === 0) return [];
    let rows: DonationCampaignV2ListItem[];
    if (!l1Results || l1Results.length !== baseCampaigns.length * 2) {
      rows = baseCampaigns.map((c) => ({ ...c, l1RecordedTotalWei: 0n, l1RecordedDonationCount: 0n }));
    } else {
      rows = baseCampaigns.map((c, i) => ({
        ...c,
        l1RecordedTotalWei: parseBigintResult(l1Results[i * 2]),
        l1RecordedDonationCount: parseBigintResult(l1Results[i * 2 + 1]),
      }));
    }
    return filterTombstonedV2Campaigns(rows);
  }, [baseCampaigns, l1Results]);

  const refetch = () => {
    void refetchCount();
    void refetchIds();
    void refetchCampaigns();
    void refetchL1();
  };

  return {
    campaigns,
    isLoading: loadingCount || loadingIds || loadingCampaigns || (baseCampaigns.length > 0 && loadingL1),
    error: (countError as Error) ?? null,
    refetch,
  };
}

