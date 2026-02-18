'use client';

import { useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { REVENUE_TREE_MANAGER_ABI } from '@/lib/contracts/abis';

export interface UseSetReferrerReturn {
  /** Call to set referrer on-chain (one-time per user). */
  setReferrer: (referrerAddress: `0x${string}`) => Promise<void>;
  /** Transaction hash after write. */
  txHash: `0x${string}` | undefined;
  /** Waiting for user signature. */
  isPending: boolean;
  /** Waiting for confirmation. */
  isConfirming: boolean;
  /** Write succeeded and tx confirmed. */
  isSuccess: boolean;
  /** Error message if any. */
  error: string | null;
  /** Whether RevenueTreeManager is deployed on this chain. */
  isSupported: boolean;
}

export function useSetReferrer(): UseSetReferrerReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId, 'RevenueTreeManager');
  const isSupported = !!contractAddress && contractAddress.length > 0;

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const setReferrer = useCallback(
    async (referrerAddress: `0x${string}`) => {
      if (!contractAddress) {
        throw new Error('Revenue Tree is not deployed on this network');
      }
      if (!address) {
        throw new Error('Connect your wallet first');
      }
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: REVENUE_TREE_MANAGER_ABI,
        functionName: 'setReferrer',
        args: [referrerAddress],
      });
    },
    [contractAddress, address, writeContract]
  );

  const error =
    writeError?.message ?? (txError?.message ?? null) ??
    (typeof writeError === 'string' ? writeError : null) ??
    (typeof txError === 'string' ? txError : null);

  return {
    setReferrer,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ?? null,
    isSupported,
  };
}
