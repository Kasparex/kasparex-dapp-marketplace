/**
 * Campaign detail: V1 by creator address, or V2 when ?campaignId= is present (must match creator).
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import type { DonationCampaign } from '@/lib/donations/types';
import { useDonationCampaign } from '@/hooks/useDonationCampaign';

const ZERO = '0x0000000000000000000000000000000000000000';

type V2Tuple = readonly [bigint, Address, bigint, bigint, bigint, bigint, bigint, string, string, boolean];

function parseV2Campaign(data: unknown, expectedId: bigint): { creator: Address; targetWei: bigint; deadline: bigint; raisedWei: bigint; donorCount: bigint; ipfsHash: string; l1Address: string; active: boolean } | null {
  const t = data as unknown as V2Tuple | undefined;
  if (!t || t[1] === ZERO) return null;
  if (t[0] !== expectedId) return null;
  return {
    creator: t[1],
    targetWei: t[3],
    deadline: t[4],
    raisedWei: t[5],
    donorCount: t[6],
    ipfsHash: t[7],
    l1Address: t[8],
    active: t[9],
  };
}

export function useDonationCampaignPage(creatorAddress: string | null, campaignIdParam: string | null): {
  campaign: DonationCampaign | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isV2Detail: boolean;
} {
  const v2Addr = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2');
  const idBig = useMemo(() => {
    if (!campaignIdParam || !/^\d+$/.test(campaignIdParam)) return null;
    try {
      return BigInt(campaignIdParam);
    } catch {
      return null;
    }
  }, [campaignIdParam]);

  const useV2Path = Boolean(v2Addr && idBig !== null && creatorAddress);

  const v1 = useDonationCampaign(!useV2Path ? creatorAddress : null);

  const { data: v2Raw, isLoading: loadingV2Main, error: errV2, refetch: refetchV2Main } = useReadContract({
    chainId: CROWDKAS_CHAIN_ID,
    address: (v2Addr || undefined) as Address | undefined,
    abi: DONATION_ESCROW_V2_ABI,
    functionName: 'campaignsById',
    args: useV2Path && idBig != null ? [idBig] : undefined,
    query: { enabled: useV2Path },
  });

  const v2Parsed = useMemo(() => {
    if (!useV2Path || idBig == null) return null;
    return parseV2Campaign(v2Raw, idBig);
  }, [useV2Path, idBig, v2Raw]);

  const v2Match =
    Boolean(creatorAddress && v2Parsed?.creator && v2Parsed.creator.toLowerCase() === creatorAddress.toLowerCase());

  const { data: extras, isLoading: loadingExtras, refetch: refetchExtras } = useReadContracts({
    allowFailure: true,
    contracts:
      useV2Path && v2Match && v2Parsed && idBig != null
        ? ([
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: v2Addr as Address,
              abi: DONATION_ESCROW_V2_ABI,
              functionName: 'verified',
              args: [v2Parsed.creator],
            },
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: v2Addr as Address,
              abi: DONATION_ESCROW_V2_ABI,
              functionName: 'l1RecordedTotalWei',
              args: [idBig],
            },
            {
              chainId: CROWDKAS_CHAIN_ID,
              address: v2Addr as Address,
              abi: DONATION_ESCROW_V2_ABI,
              functionName: 'l1RecordedDonationCount',
              args: [idBig],
            },
          ] as const)
        : [],
    query: { enabled: Boolean(useV2Path && v2Match && v2Parsed && idBig != null) },
  });

  const campaign = useMemo((): DonationCampaign | null => {
    if (useV2Path && idBig != null && v2Parsed) {
      if (!v2Match || !creatorAddress) return null;
      const isVerified = extras?.[0]?.status === 'success' ? Boolean(extras[0].result) : false;
      const l1w = extras?.[1]?.status === 'success' && typeof extras[1].result === 'bigint' ? extras[1].result : 0n;
      const l1c = extras?.[2]?.status === 'success' && typeof extras[2].result === 'bigint' ? extras[2].result : 0n;
      return {
        creatorAddress: creatorAddress as `0x${string}`,
        campaignIdV2: idBig,
        targetWei: v2Parsed.targetWei,
        deadline: v2Parsed.deadline,
        raisedWei: v2Parsed.raisedWei,
        donorCount: v2Parsed.donorCount,
        l1RecordedTotalWei: l1w,
        l1RecordedDonationCount: l1c,
        ipfsHash: v2Parsed.ipfsHash,
        l1Address: v2Parsed.l1Address,
        active: v2Parsed.active,
        verified: isVerified,
        metadata: null,
      };
    }
    return v1.campaign;
  }, [useV2Path, idBig, v2Parsed, v2Match, creatorAddress, extras, v1.campaign]);

  const isLoading = useV2Path
    ? loadingV2Main || (Boolean(v2Match && v2Parsed) && loadingExtras)
    : v1.isLoading;

  const error = useV2Path ? ((errV2 as Error) ?? null) : v1.error;

  const refetch = () => {
    if (useV2Path) {
      void refetchV2Main();
      void refetchExtras();
    } else {
      void v1.refetch();
    }
  };

  return { campaign, isLoading, error, refetch, isV2Detail: useV2Path };
}
