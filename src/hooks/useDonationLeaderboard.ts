'use client';

import { usePublicClient } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import { formatEther, getAddress } from 'viem';
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

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['donation-leaderboard', creatorAddress?.toLowerCase(), limit],
    queryFn: async (): Promise<DonorEntry[]> => {
      if (!creatorAddress || !escrowAddress || !publicClient) return [];
      let creator: Address;
      try {
        creator = getAddress(creatorAddress);
      } catch {
        return [];
      }
      const logs = await publicClient.getContractEvents({
        address: escrowAddress as Address,
        abi: DONATION_ESCROW_ABI,
        eventName: 'Donated',
        args: { creator },
        fromBlock: 'earliest',
      });
      const byDonor = new Map<string, bigint>();
      for (const log of logs) {
        if (log.args.donor != null && log.args.amountWei != null) {
          const d = getAddress(log.args.donor as Address);
          byDonor.set(d, (byDonor.get(d) ?? 0n) + (log.args.amountWei as bigint));
        }
      }
      const sorted = [...byDonor.entries()]
        .sort((a, b) => (b[1] > a[1] ? 1 : a[1] > b[1] ? -1 : 0))
        .slice(0, limit)
        .map(([donor, totalWei]) => ({
          donor: donor as Address,
          totalWei,
          formatted: formatEther(totalWei),
        }));
      return sorted;
    },
    enabled: Boolean(creatorAddress && escrowAddress && publicClient),
    staleTime: 60_000,
  });

  return { leaderboard: leaderboard ?? [], isLoading, error };
}
