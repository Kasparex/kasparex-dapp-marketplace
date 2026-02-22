'use client';

import { useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import { formatEther } from 'viem';
import type { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';

export interface DonorEntry {
  donor: Address;
  totalWei: bigint;
  formatted: string;
}

const CHAIN_ID = 38836;

export function useDonationLeaderboard(creatorAddress: string | null, limit = 20) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const escrowAddress = getContractAddress(CHAIN_ID, 'DonationEscrow');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['donation-leaderboard', creatorAddress, limit],
    queryFn: async (): Promise<DonorEntry[]> => {
      if (!creatorAddress || !escrowAddress || !publicClient) return [];
      const logs = await publicClient.getContractEvents({
        address: escrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        eventName: 'Donated',
        args: { creator: creatorAddress as Address },
        fromBlock: 0n,
      });
      const byDonor = new Map<string, bigint>();
      for (const log of logs) {
        if (log.args.donor && log.args.amountWei != null) {
          const d = (log.args.donor as Address).toLowerCase();
          byDonor.set(d, (byDonor.get(d) ?? 0n) + log.args.amountWei);
        }
      }
      const sorted = [...byDonor.entries()]
        .sort((a, b) => (b[1] > a[1] ? 1 : -1))
        .slice(0, limit)
        .map(([donor, totalWei]) => ({
          donor: donor as Address,
          totalWei,
          formatted: formatEther(totalWei),
        }));
      return sorted;
    },
    enabled: Boolean(creatorAddress && escrowAddress && publicClient),
  });

  return { leaderboard: leaderboard ?? [], isLoading };
}
