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
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';

const CHAIN_ID = 38833;

type L1DonationRecordedLog = {
  args: {
    amountWei?: bigint;
  };
};

export function useDonationPoints(creatorAddress: string | null, donorAddress: string | null) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const escrowAddress = getContractAddress(CHAIN_ID, 'DonationEscrow');

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

  const { data: l2Wei } = useReadContract({
    chainId: CHAIN_ID,
    address: (escrowAddress || undefined) as Address | undefined,
    abi: DONATION_ESCROW_ABI,
    functionName: 'contributions',
    args: creator && donor ? [creator, donor] : undefined,
    query: { enabled: Boolean(escrowAddress && creator && donor) },
  });

  const { data: l1Wei, isLoading: l1Loading } = useQuery({
    queryKey: ['donation-points-l1', creator?.toLowerCase(), donor?.toLowerCase()],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !escrowAddress || !creator || !donor) return 0n;
      // donorL2 is indexed in the event so viem can filter by args.
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
    enabled: Boolean(publicClient && escrowAddress && creator && donor),
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

