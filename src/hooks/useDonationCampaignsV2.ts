/**
 * Hook to enumerate donation campaigns from DonationEscrowV2 (multi-campaign).
 * Reads always use Igra Mainnet (38833) so listings work without a connected wallet.
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

const MAX_CAMPAIGNS_V2 = 200;

export type DonationMethodV2 = 'L2_ESCROW' | 'L1_DIRECT';

export interface DonationCampaignV2ListItem {
  campaignId: bigint;
  creatorAddress: `0x${string}`;
  method: DonationMethodV2;
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
  l1RecordedTotalWei?: bigint;
  l1RecordedDonationCount?: bigint;
}

type CampaignV2Tuple = readonly [
  bigint, // id
  Address, // creator
  bigint, // method uint8
  bigint, // targetWei
  bigint, // deadline
  bigint, // raisedWei
  bigint, // donorCount
  string, // ipfsHash
  string, // l1Address
  boolean // active
];

function parseMethod(m: bigint): DonationMethodV2 {
  return m === 1n ? 'L1_DIRECT' : 'L2_ESCROW';
}

function parseBigintResult(r: { status: string; result?: unknown } | undefined): bigint {
  if (!r || r.status !== 'success' || r.result == null) return 0n;
  return r.result as bigint;
}

export function useDonationCampaignsV2(): {
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
    functionName: 'getCampaignCount',
    query: { enabled: Boolean(escrowV2Address) },
  });

  const campaignCount = countBig != null ? Math.min(Number(countBig), MAX_CAMPAIGNS_V2) : 0;

  const idReadConfigs = useMemo(
    () =>
      campaignCount > 0 && escrowV2Address
        ? Array.from({ length: campaignCount }, (_, i) => ({
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowV2Address,
            abi: DONATION_ESCROW_V2_ABI,
            functionName: 'campaignIdAt' as const,
            args: [BigInt(i)] as const,
          }))
        : [],
    [campaignCount, escrowV2Address]
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
      const creator = t[1];
      if (!creator) return;
      list.push({
        campaignId: campaignIds[i],
        creatorAddress: creator as `0x${string}`,
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
    if (!l1Results || l1Results.length !== baseCampaigns.length * 2) {
      return baseCampaigns.map((c) => ({ ...c, l1RecordedTotalWei: 0n, l1RecordedDonationCount: 0n }));
    }
    return baseCampaigns.map((c, i) => ({
      ...c,
      l1RecordedTotalWei: parseBigintResult(l1Results[i * 2]),
      l1RecordedDonationCount: parseBigintResult(l1Results[i * 2 + 1]),
    }));
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

