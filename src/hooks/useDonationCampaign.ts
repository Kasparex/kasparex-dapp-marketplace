/**
 * Hook to fetch a single donation campaign by creator address (on-chain + IPFS metadata).
 * Public reads use Igra Mainnet (38833) so the page works without a connected wallet.
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import type { Address } from 'viem';
import { fetchJSON } from '@/lib/ipfs/gateway';
import type { DonationCampaign, DonationCampaignMetadata } from '@/lib/donations/types';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';

const ZERO = '0x0000000000000000000000000000000000000000';
const metaCache = new Map<string, DonationCampaignMetadata | null>();
const META_LS_PREFIX = 'crowdkas:meta:';

// readContract returns tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];

function parseCampaign(data: unknown): CampaignTuple | null {
  const t = data as unknown as CampaignTuple | undefined;
  if (!t || t[0] === ZERO) return null;
  return t;
}

export function useDonationCampaign(creatorAddress: string | null): {
  campaign: DonationCampaign | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const escrowAddress = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrow');

  const enabled = Boolean(creatorAddress && escrowAddress);
  const { data: results, isLoading, error, refetch } = useReadContracts({
    allowFailure: true,
    contracts: enabled
      ? ([
          {
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            functionName: 'campaigns',
            args: [creatorAddress as Address],
          },
          {
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            functionName: 'verified',
            args: [creatorAddress as Address],
          },
          {
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            functionName: 'l1RecordedTotalWei',
            args: [creatorAddress as Address],
          },
          {
            chainId: CROWDKAS_CHAIN_ID,
            address: escrowAddress as Address,
            abi: DONATION_ESCROW_ABI,
            functionName: 'l1RecordedDonationCount',
            args: [creatorAddress as Address],
          },
        ] as const)
      : [],
    query: { enabled },
  });

  const campaign: DonationCampaign | null = useMemo(() => {
    if (!creatorAddress || !escrowAddress) return null;
    const campaignOnChain = results?.[0]?.status === 'success' ? results[0].result : null;
    const isVerified = results?.[1]?.status === 'success' ? results[1].result : null;
    const l1TotalWei = results?.[2]?.status === 'success' ? results[2].result : null;
    const l1DonorCount = results?.[3]?.status === 'success' ? results[3].result : null;

    const t = parseCampaign(campaignOnChain);
    if (!t) return null;
    return {
      creatorAddress: creatorAddress as `0x${string}`,
      targetWei: t[1],
      deadline: t[2],
      raisedWei: t[3],
      donorCount: t[4],
      l1RecordedTotalWei: typeof l1TotalWei === 'bigint' ? l1TotalWei : 0n,
      l1RecordedDonationCount: typeof l1DonorCount === 'bigint' ? l1DonorCount : 0n,
      ipfsHash: t[5],
      l1Address: t[6],
      active: t[7],
      verified: Boolean(isVerified),
      metadata: null,
    };
  }, [creatorAddress, escrowAddress, results]);

  return {
    campaign,
    isLoading,
    error: (error as Error) ?? null,
    refetch: () => void refetch(),
  };
}

/** Fetch campaign metadata from IPFS by hash */
export async function fetchCampaignMetadata(ipfsHash: string): Promise<DonationCampaignMetadata | null> {
  if (!ipfsHash?.trim()) return null;
  const clean = ipfsHash.replace(/^ipfs:\/\//, '').replace(/^\/ipfs\//, '');
  const cached = metaCache.get(clean);
  if (cached !== undefined) return cached;

  // Fast path: localStorage cache (browser only)
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(META_LS_PREFIX + clean);
      if (raw) {
        const parsed = JSON.parse(raw) as DonationCampaignMetadata;
        metaCache.set(clean, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const meta = await fetchJSON<DonationCampaignMetadata>(clean);
  metaCache.set(clean, meta ?? null);
  if (typeof window !== 'undefined' && meta) {
    try {
      window.localStorage.setItem(META_LS_PREFIX + clean, JSON.stringify(meta));
    } catch {
      // ignore quota errors
    }
  }
  return meta ?? null;
}
