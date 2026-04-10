'use client';

import { usePublicClient } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI, DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { formatEther, getAddress } from 'viem';
import type { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';

export interface DonorEntry {
  donor: Address;
  totalWei: bigint;
  formatted: string;
}

const CHAIN_ID = 38833;

/** Narrow shape for L1 logs (viem types Donated vs L1DonationRecorded as incompatible arrays). */
type L1DonationRecordedLog = {
  args: {
    donorL2?: Address;
    amountWei?: bigint;
  };
};

/** Refetch only when donorCount or raisedWei change (from campaign), not on every render. */
export function useDonationLeaderboard(
  creatorAddress: string | null,
  limit = 20,
  options?: { donorCount?: bigint; raisedWei?: bigint; campaignId?: bigint }
) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const escrowAddress = getContractAddress(CHAIN_ID, 'DonationEscrow');
  const escrowV2Address = getContractAddress(CHAIN_ID, 'DonationEscrowV2');
  const campaignId = options?.campaignId;

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: [
      'donation-leaderboard',
      creatorAddress?.toLowerCase(),
      limit,
      options?.donorCount?.toString(),
      options?.raisedWei?.toString(),
      campaignId?.toString() ?? '',
    ],
    queryFn: async (): Promise<DonorEntry[]> => {
      if (!creatorAddress || !publicClient) return [];
      let creator: Address;
      try {
        creator = getAddress(creatorAddress);
      } catch {
        return [];
      }

      const byDonor = new Map<string, bigint>();

      if (campaignId != null && escrowV2Address) {
        const l2Logs = await publicClient.getContractEvents({
          address: escrowV2Address as Address,
          abi: DONATION_ESCROW_V2_ABI,
          eventName: 'Donated',
          args: { campaignId, creator },
          fromBlock: 'earliest',
        });
        let l1Logs: L1DonationRecordedLog[] = [];
        try {
          l1Logs = (await publicClient.getContractEvents({
            address: escrowV2Address as Address,
            abi: DONATION_ESCROW_V2_ABI,
            eventName: 'L1DonationRecorded',
            args: { campaignId, creator },
            fromBlock: 'earliest',
          })) as L1DonationRecordedLog[];
        } catch {
          /* ignore */
        }
        for (const log of l2Logs) {
          if (log.args.donor != null && log.args.amountWei != null) {
            const d = getAddress(log.args.donor as Address);
            byDonor.set(d, (byDonor.get(d) ?? 0n) + (log.args.amountWei as bigint));
          }
        }
        for (const log of l1Logs) {
          if (log.args.donorL2 != null && log.args.amountWei != null) {
            const d = getAddress(log.args.donorL2 as Address);
            byDonor.set(d, (byDonor.get(d) ?? 0n) + (log.args.amountWei as bigint));
          }
        }
      } else if (escrowAddress) {
        const l2Logs = await publicClient.getContractEvents({
          address: escrowAddress as Address,
          abi: DONATION_ESCROW_ABI,
          eventName: 'Donated',
          args: { creator },
          fromBlock: 'earliest',
        });
        let l1Logs: L1DonationRecordedLog[] = [];
        try {
          l1Logs = (await publicClient.getContractEvents({
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            eventName: 'L1DonationRecorded',
            args: { creator },
            fromBlock: 'earliest',
          })) as L1DonationRecordedLog[];
        } catch {
          // Older escrow deployments or mismatched event ABI: leaderboard still shows L2 only.
        }
        for (const log of l2Logs) {
          if (log.args.donor != null && log.args.amountWei != null) {
            const d = getAddress(log.args.donor as Address);
            byDonor.set(d, (byDonor.get(d) ?? 0n) + (log.args.amountWei as bigint));
          }
        }
        for (const log of l1Logs) {
          if (log.args.donorL2 != null && log.args.amountWei != null) {
            const d = getAddress(log.args.donorL2 as Address);
            byDonor.set(d, (byDonor.get(d) ?? 0n) + (log.args.amountWei as bigint));
          }
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
    enabled: Boolean(
      creatorAddress &&
        publicClient &&
        ((campaignId != null && escrowV2Address) || (campaignId == null && escrowAddress))
    ),
    staleTime: 5 * 60 * 1000, // 5 min - refetch when campaign donorCount/raisedWei change (query key)
    refetchOnWindowFocus: false,
  });

  return { leaderboard: leaderboard ?? [], isLoading, error };
}
