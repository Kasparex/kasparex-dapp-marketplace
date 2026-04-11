'use client';

import { usePublicClient } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI, DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { formatEther, getAddress } from 'viem';
import type { Address } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

export interface LatestDonationEntry {
  donor: Address;
  txHash: `0x${string}`;
  formattedAmount: string;
  blockNumber: bigint;
  logIndex: number;
}

type L1DonationRecordedLog = {
  blockNumber: bigint;
  logIndex: number;
  transactionHash: `0x${string}`;
  args: {
    donorL2?: Address;
    amountWei?: bigint;
  };
};

/** Latest L2 + recorded L1 donation events for a campaign (or V1 creator), newest first. */
export function useDonationLeaderboard(
  creatorAddress: string | null,
  limit = 20,
  options?: { donorCount?: bigint; raisedWei?: bigint; campaignId?: bigint }
) {
  const publicClient = usePublicClient({ chainId: CROWDKAS_CHAIN_ID });
  const escrowAddress = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrow');
  const escrowV2Address = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2');
  const campaignId = options?.campaignId;

  const { data: entries, isLoading, error } = useQuery({
    queryKey: [
      'donation-latest-donations',
      creatorAddress?.toLowerCase(),
      limit,
      options?.donorCount?.toString(),
      options?.raisedWei?.toString(),
      campaignId?.toString() ?? '',
    ],
    queryFn: async (): Promise<LatestDonationEntry[]> => {
      if (!creatorAddress || !publicClient) return [];
      let creator: Address;
      try {
        creator = getAddress(creatorAddress);
      } catch {
        return [];
      }

      const raw: LatestDonationEntry[] = [];

      if (campaignId != null && escrowV2Address) {
        const l2Logs = await publicClient.getContractEvents({
          address: escrowV2Address as Address,
          abi: DONATION_ESCROW_V2_ABI,
          eventName: 'Donated',
          args: { campaignId, creator },
          fromBlock: 'earliest',
        });
        for (const log of l2Logs) {
          if (log.args.donor != null && log.args.amountWei != null && log.transactionHash) {
            raw.push({
              donor: getAddress(log.args.donor as Address),
              txHash: log.transactionHash,
              formattedAmount: formatEther(log.args.amountWei as bigint),
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
            });
          }
        }
        try {
          const l1Logs = (await publicClient.getContractEvents({
            address: escrowV2Address as Address,
            abi: DONATION_ESCROW_V2_ABI,
            eventName: 'L1DonationRecorded',
            args: { campaignId, creator },
            fromBlock: 'earliest',
          })) as L1DonationRecordedLog[];
          for (const log of l1Logs) {
            if (log.args.donorL2 != null && log.args.amountWei != null && log.transactionHash) {
              raw.push({
                donor: getAddress(log.args.donorL2 as Address),
                txHash: log.transactionHash,
                formattedAmount: formatEther(log.args.amountWei as bigint),
                blockNumber: log.blockNumber,
                logIndex: log.logIndex,
              });
            }
          }
        } catch {
          /* ignore */
        }
      } else if (escrowAddress) {
        const l2Logs = await publicClient.getContractEvents({
          address: escrowAddress as Address,
          abi: DONATION_ESCROW_ABI,
          eventName: 'Donated',
          args: { creator },
          fromBlock: 'earliest',
        });
        for (const log of l2Logs) {
          if (log.args.donor != null && log.args.amountWei != null && log.transactionHash) {
            raw.push({
              donor: getAddress(log.args.donor as Address),
              txHash: log.transactionHash,
              formattedAmount: formatEther(log.args.amountWei as bigint),
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
            });
          }
        }
        try {
          const l1Logs = (await publicClient.getContractEvents({
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            eventName: 'L1DonationRecorded',
            args: { creator },
            fromBlock: 'earliest',
          })) as L1DonationRecordedLog[];
          for (const log of l1Logs) {
            if (log.args.donorL2 != null && log.args.amountWei != null && log.transactionHash) {
              raw.push({
                donor: getAddress(log.args.donorL2 as Address),
                txHash: log.transactionHash,
                formattedAmount: formatEther(log.args.amountWei as bigint),
                blockNumber: log.blockNumber,
                logIndex: log.logIndex,
              });
            }
          }
        } catch {
          /* ignore */
        }
      }

      raw.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return a.blockNumber > b.blockNumber ? -1 : 1;
        }
        return a.logIndex > b.logIndex ? -1 : 1;
      });

      return raw.slice(0, limit);
    },
    enabled: Boolean(
      creatorAddress &&
        publicClient &&
        ((campaignId != null && escrowV2Address) || (campaignId == null && escrowAddress))
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { latestDonations: entries ?? [], isLoading, error };
}
