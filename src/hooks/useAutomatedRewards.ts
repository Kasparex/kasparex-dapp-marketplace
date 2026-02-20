/**
 * Automated Rewards Hook
 * 
 * Provides automated reward distribution after successful dApp transactions
 * Handles L1, L2, and vProgs networks automatically
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Address, parseEther } from 'viem';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from './useKREXBalance';
import { useNFTStatus } from './useNFTStatus';
import { calculateRewardAmount, type RewardCalculationResult } from '@/lib/rewards/rewardCalculator';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';
import { recordUsageAndRewardL1 } from '@/lib/rewards/l1Distribution';
import { recordUsageAndRewardVProgs } from '@/lib/rewards/vprogsDistribution';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useQueryClient } from '@tanstack/react-query';
import { KREX_TIERS } from '@/lib/rewards/types';

export interface DistributeRewardOptions {
  dapp: DApp;
  actionId: string;
  actionType: string;
  baseActionValue: number; // Base action value in KAS (before discounts)
  txHash: string; // Transaction hash of the original dApp transaction
  dAppContractAddress?: Address | string; // dApp contract address (for L2)
}

export interface UseAutomatedRewardsReturn {
  distributeRewardAfterTransaction: (options: DistributeRewardOptions) => Promise<{ success: boolean; rewardId?: string; error?: string }>;
  calculateReward: (dapp: DApp, actionId: string, baseActionValue: number) => RewardCalculationResult | null;
  isDistributing: boolean;
  error: string | null;
}

/**
 * Hook for automated reward distribution
 * 
 * Automatically detects network type and routes to appropriate handler:
 * - L2 (EVM): No separate reward tx; rewards are distributed by FeeRouter in the same tx. L2 path is a no-op.
 * - L1 (Kaspa Native): Uses backend API
 * - vProgs: Uses vProgs contract abstraction (when available)
 */
export function useAutomatedRewards(): UseAutomatedRewardsReturn {
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const chainId = useChainId();
  const { state: kaspaState } = useKaspaWallet();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const queryClient = useQueryClient();
  
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { writeContract, data: rewardTxHash, isPending: isPendingReward } = useWriteContract();
  const { isLoading: isConfirmingReward, isSuccess: isRewardSuccess } = useWaitForTransactionReceipt({
    hash: rewardTxHash,
  });

  // Calculate reward amount (separate from cost calculation)
  const calculateReward = useCallback((
    dapp: DApp,
    actionId: string,
    baseActionValue: number
  ): RewardCalculationResult | null => {
    if (!krexBalance || !tier) {
      return null;
    }

    const tierConfig = KREX_TIERS[tier];
    const multiplier = tierConfig.multiplier;

    return calculateRewardAmount({
      dapp,
      actionId,
      baseActionValue,
      krexTier: tier,
      multiplier,
      chainId,
    });
  }, [krexBalance, tier, chainId]);

  // Distribute reward after successful transaction
  const distributeRewardAfterTransaction = useCallback(async (
    options: DistributeRewardOptions
  ): Promise<{ success: boolean; rewardId?: string; error?: string }> => {
    const {
      dapp,
      actionId,
      actionType,
      baseActionValue,
      txHash,
      dAppContractAddress,
    } = options;

    setIsDistributing(true);
    setError(null);

    try {
      // Determine network type
      const networkType = getDAppNetworkType(dapp);
      
      // Get user address based on network
      let userAddress: Address | string;
      if (networkType === 'L2') {
        if (!evmAddress || !isEVMConnected) {
          throw new Error('EVM wallet not connected');
        }
        userAddress = evmAddress;
      } else if (networkType === 'L1') {
        if (!kaspaState.address || !kaspaState.isConnected) {
          throw new Error('Kaspa wallet not connected');
        }
        userAddress = kaspaState.address;
      } else {
        // vProgs - use EVM address for now
        if (!evmAddress || !isEVMConnected) {
          throw new Error('Wallet not connected');
        }
        userAddress = evmAddress;
      }

      // Route to appropriate handler based on network type
      if (networkType === 'L2') {
        // L2: Rewards are distributed by FeeRouter in the same tx as the payment. No ProofOfUtility call.
        queryClient.invalidateQueries({ queryKey: ['gridToken'] });
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
        return { success: true };
      } else if (networkType === 'L1') {
        // L1: Use backend API
        const result = await recordUsageAndRewardL1(
          userAddress as string,
          dapp.id,
          actionType,
          baseActionValue,
          txHash
        );

        if (result.success) {
          // Refresh balances after successful reward distribution
          queryClient.invalidateQueries({ queryKey: ['gridToken'] });
          queryClient.invalidateQueries({ queryKey: ['dAppToken'] });
          queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
        }

        return result;
      } else {
        // vProgs: Use vProgs contract abstraction
        if (!dAppContractAddress) {
          throw new Error('dApp contract address required for vProgs');
        }

        const result = await recordUsageAndRewardVProgs(
          userAddress as string,
          dAppContractAddress as string,
          dapp.id,
          actionType,
          parseEther(baseActionValue.toString())
        );

        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDistributing(false);
    }
  }, [
    evmAddress,
    isEVMConnected,
    chainId,
    kaspaState.address,
    kaspaState.isConnected,
    writeContract,
    queryClient,
  ]);

  // Update distributing state based on transaction status
  const isDistributingState = isDistributing || isPendingReward || isConfirmingReward;

  // Refresh balances when reward transaction succeeds
  if (isRewardSuccess && rewardTxHash) {
    queryClient.invalidateQueries({ queryKey: ['gridToken'] });
    queryClient.invalidateQueries({ queryKey: ['dAppToken'] });
    queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
  }

  return {
    distributeRewardAfterTransaction,
    calculateReward,
    isDistributing: isDistributingState,
    error,
  };
}
