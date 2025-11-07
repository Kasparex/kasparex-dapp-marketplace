'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { DAO_VOTING_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useSafeError } from './useSafeError';

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: `0x${string}`;
  submissionFee: bigint;
  voteFee: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  createdAt: bigint;
  isFlagged: boolean;
  isActive: boolean;
}

export interface Vote {
  support: boolean;
  timestamp: bigint;
}

interface UseDAOVotingReturn {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  submitProposal: (title: string, description: string) => Promise<void>;
  vote: (proposalId: bigint, support: boolean) => Promise<void>;
  changeVote: (proposalId: bigint, newSupport: boolean) => Promise<void>;
  getUserVote: (proposalId: bigint) => Promise<Vote | null>;
  refreshProposals: () => Promise<void>;
  submissionFee: bigint | null;
  voteFee: bigint | null;
  flagThreshold: bigint | null;
  proposalCount: bigint | null;
}

export function useDAOVoting(): UseDAOVotingReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(chainId, 'DAOVoting');

  // Read contract state
  const { data: proposalCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: 'proposalCount',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  const { data: submissionFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: 'submissionFee',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  const { data: voteFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: 'voteFee',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  const { data: flagThreshold } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DAO_VOTING_ABI,
    functionName: 'flagThreshold',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  // Write contract
  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const safeWriteError = useSafeError(writeError);
  const safeTxError = useSafeError(txError);

  // Load proposals
  const loadProposals = useCallback(async () => {
    if (!contractAddress || !proposalCount || proposalCount === 0n || !publicClient) {
      setProposals([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const totalProposals = Number(proposalCount);
      const fetchedProposals: Proposal[] = [];

      // Fetch proposals using getProposals in batches
      const batchSize = 50;
      for (let offset = 0; offset < totalProposals; offset += batchSize) {
        const limit = Math.min(batchSize, totalProposals - offset);
        try {
          const batch = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: DAO_VOTING_ABI,
            functionName: 'getProposals',
            args: [BigInt(offset), BigInt(limit)],
          });
          fetchedProposals.push(...(batch as Proposal[]));
        } catch (err) {
          console.error(`Error loading proposals batch ${offset}-${offset + limit}:`, err);
          // Fallback: fetch proposals one by one
          for (let i = offset + 1; i <= Math.min(offset + limit, totalProposals); i++) {
            try {
              const proposal = await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: DAO_VOTING_ABI,
                functionName: 'getProposal',
                args: [BigInt(i)],
              });
              fetchedProposals.push(proposal as Proposal);
            } catch (err2) {
              console.error(`Error loading proposal ${i}:`, err2);
            }
          }
        }
      }

      setProposals(fetchedProposals);
    } catch (err) {
      console.error('Error loading proposals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, proposalCount, publicClient]);

  // Refresh proposals
  const refreshProposals = useCallback(async () => {
    await loadProposals();
  }, [loadProposals]);

  // Submit proposal
  const submitProposal = useCallback(async (title: string, description: string) => {
    if (!contractAddress || !submissionFee) {
      throw new Error('Contract not available');
    }

    setError(null);

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: DAO_VOTING_ABI,
        functionName: 'submitProposal',
        args: [title, description],
        value: submissionFee,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit proposal';
      setError(errorMessage);
      throw err;
    }
  }, [contractAddress, submissionFee, writeContract]);

  // Vote
  const vote = useCallback(async (proposalId: bigint, support: boolean) => {
    if (!contractAddress || !voteFee) {
      throw new Error('Contract not available');
    }

    setError(null);

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: DAO_VOTING_ABI,
        functionName: 'vote',
        args: [proposalId, support],
        value: voteFee,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMessage);
      throw err;
    }
  }, [contractAddress, voteFee, writeContract]);

  // Change vote
  const changeVote = useCallback(async (proposalId: bigint, newSupport: boolean) => {
    if (!contractAddress || !voteFee) {
      throw new Error('Contract not available');
    }

    setError(null);

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: DAO_VOTING_ABI,
        functionName: 'changeVote',
        args: [proposalId, newSupport],
        value: voteFee,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change vote';
      setError(errorMessage);
      throw err;
    }
  }, [contractAddress, voteFee, writeContract]);

  // Get user vote
  const getUserVote = useCallback(async (proposalId: bigint): Promise<Vote | null> => {
    if (!contractAddress || !address || !publicClient) {
      return null;
    }

    try {
      const vote = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: DAO_VOTING_ABI,
        functionName: 'getUserVote',
        args: [proposalId, address],
      });
      return vote as Vote;
    } catch (err) {
      console.error('Error getting user vote:', err);
      return null;
    }
  }, [contractAddress, address, publicClient]);

  // Refresh proposals when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && !isConfirming) {
      setTimeout(() => {
        loadProposals();
      }, 2000);
    }
  }, [isConfirmed, isConfirming, loadProposals]);

  // Load proposals on mount and when proposalCount changes
  useEffect(() => {
    if (contractAddress && proposalCount !== undefined) {
      loadProposals();
    }
  }, [contractAddress, proposalCount, loadProposals]);

  // Update error from transaction
  useEffect(() => {
    if (safeWriteError || safeTxError) {
      setError(safeWriteError || safeTxError || null);
    }
  }, [safeWriteError, safeTxError]);

  return {
    proposals,
    isLoading: isLoading || isPendingWrite || isConfirming,
    error: error || safeWriteError || safeTxError,
    submitProposal,
    vote,
    changeVote,
    getUserVote,
    refreshProposals,
    submissionFee: submissionFee || null,
    voteFee: voteFee || null,
    flagThreshold: flagThreshold || null,
    proposalCount: proposalCount || null,
  };
}

