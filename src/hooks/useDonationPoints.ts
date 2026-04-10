/**
 * Points model foundation for CrowdKAS V1:
 * - L2 escrow: points from contributions(creator, donor)
 * - L1 direct recorded: points from L1DonationRecorded(creator, donorL2)
 */

'use client';

import { useMemo } from 'react';
import { usePublicClient, useReadContract } from 'wagmi';
import { getAddress, formatEther } from 'viem';
import type { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI, DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';

const CHAIN_ID = 38833;

type L1DonationRecordedLog = {
  args: {
    amountWei?: bigint;
  };
};

export function useDonationPoints(
  creatorAddress: string | null,
  donorAddress: string | null,
  options?: { campaignId?: bigint }
) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const escrowAddress = getContractAddress(CHAIN_ID, 'DonationEscrow');
  const escrowV2Address = getContractAddress(CHAIN_ID, 'DonationEscrowV2');
  const campaignId = options?.campaignId;

  const creator = useMemo(() => {
    try {
      return creatorAddress ? getAddress(creatorAddress) : null;
    } catch {
      return null;
    }
  }, [creatorAddress]);

  const donor = useMemo(() => {
    try {
      return donorAddress ? getAddress(donorAddress) : null;
    } catch {
      return null;
    }
  }, [donorAddress]);

  const { data: l2WeiV1 } = useReadContract({
    chainId: CHAIN_ID,
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'contributions',
    args: creator && donor && campaignId == null ? [creator, donor] : undefined,
    query: { enabled: Boolean(escrowAddress && creator && donor && campaignId == null) },
  });

  const { data: l2WeiV2 } = useReadContract({
    chainId: CHAIN_ID,
    address: (escrowV2Address || undefined) as Address | undefined,
    abi: DONATION_ESCROW_V2_ABI,
    functionName: 'contributions',
    args: creator && donor && campaignId != null ? [campaignId, donor] : undefined,
    query: { enabled: Boolean(escrowV2Address && creator && donor && campaignId != null) },
  });

  const l2Wei = campaignId != null ? l2WeiV2 : l2WeiV1;

  const { data: l1Wei, isLoading: l1Loading } = useQuery({
    queryKey: ['donation-points-l1', creator?.toLowerCase(), donor?.toLowerCase(), campaignId?.toString() ?? 'v1'],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !creator || !donor) return 0n;
      if (campaignId != null && escrowV2Address) {
        const logs = (await publicClient.getContractEvents({
          address: escrowV2Address as Address,
          abi: DONATION_ESCROW_V2_ABI,
          eventName: 'L1DonationRecorded',
          args: { campaignId, creator },
          fromBlock: 'earliest',
        })) as unknown as { args: { donorL2?: Address; amountWei?: bigint } }[];
        let sum = 0n;
        for (const log of logs) {
          if (log.args.donorL2 && getAddress(log.args.donorL2) === donor) {
            sum += log.args.amountWei ?? 0n;
          }
        }
        return sum;
      }
      if (!escrowAddress) return 0n;
      const logs = (await publicClient.getContractEvents({
        address: escrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        eventName: 'L1DonationRecorded',
        args: { creator, donorL2: donor },
        fromBlock: 'earliest',
      })) as unknown as L1DonationRecordedLog[];
      let sum = 0n;
      for (const log of logs) sum += log.args.amountWei ?? 0n;
      return sum;
    },
    enabled: Boolean(
      publicClient &&
        creator &&
        donor &&
        ((campaignId != null && escrowV2Address) || (campaignId == null && escrowAddress))
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const l2 = typeof l2Wei === 'bigint' ? l2Wei : 0n;
  const l1 = typeof l1Wei === 'bigint' ? l1Wei : 0n;
  const total = l2 + l1;

  return {
    l2Wei: l2,
    l1Wei: l1,
    totalWei: total,
    points: formatEther(total), // 1 point = 1 iKAS donated (display only)
    isLoading: l1Loading,
  };
}

