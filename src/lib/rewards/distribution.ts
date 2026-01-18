/**
 * Reward Distribution System
 * 
 * Handles automatic reward distribution after successful transactions
 * Works with existing RewardManager contract for L2
 * 
 * Note: For L2 transactions, use wagmi hooks (useWriteContract, useWaitForTransactionReceipt)
 * in React components. This file provides helper functions to get transaction parameters.
 */

import { Address } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';

// RewardManager contract ABI (simplified - only distributeReward function)
const REWARD_MANAGER_ABI = [
  {
    name: 'distributeReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'user',
        type: 'address',
      },
      {
        name: 'dAppContract',
        type: 'address',
      },
      {
        name: 'actionValue',
        type: 'uint256',
      },
    ],
    outputs: [],
  },
] as const;

/**
 * Get reward distribution transaction parameters for L2 (EVM) transactions
 * Returns the parameters needed to call distributeReward via wagmi hooks
 * 
 * Usage in component:
 * ```tsx
 * const { writeContract } = useWriteContract();
 * const { waitForTransactionReceipt } = useWaitForTransactionReceipt();
 * 
 * const params = getRewardDistributionParams(chainId, userAddress, dAppContractAddress, actionValue);
 * const hash = await writeContract(params);
 * await waitForTransactionReceipt({ hash });
 * ```
 */
export function getRewardDistributionParams(
  chainId: number,
  userAddress: Address,
  dAppContractAddress: Address,
  actionValue: bigint
): { address: Address; abi: typeof REWARD_MANAGER_ABI; functionName: 'distributeReward'; args: [Address, Address, bigint] } | null {
  const rewardManagerAddress = getContractAddress(chainId, 'RewardManager');
  
  if (!rewardManagerAddress) {
    return null;
  }
  
  return {
    address: rewardManagerAddress as Address,
    abi: REWARD_MANAGER_ABI,
    functionName: 'distributeReward',
    args: [userAddress, dAppContractAddress, actionValue],
  };
}

/**
 * Distribute rewards for L1 (Kaspa native) transactions
 * This may require a backend API or L1-specific contract
 * For now, returns a placeholder that can be implemented later
 */
export async function distributeRewardL1(
  userAddress: string,
  dAppId: string,
  actionValue: number // in KAS
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // TODO: Implement L1 reward distribution
    // This may require:
    // 1. Backend API endpoint that handles L1 reward distribution
    // 2. Or an L1-specific smart contract
    // 3. Or direct Kaspa transaction to user address
    
    // Placeholder implementation
    console.log('L1 reward distribution not yet implemented', {
      userAddress,
      dAppId,
      actionValue,
    });
    
    return {
      success: false,
      error: 'L1 reward distribution not yet implemented',
    };
  } catch (error) {
    console.error('Error distributing reward (L1):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get reward distribution parameters automatically based on network type
 * For L2, returns parameters for wagmi hooks
 * For L1, returns placeholder (to be implemented)
 */
export function getRewardDistributionParamsByNetwork(
  userAddress: Address | string,
  dAppContractAddress: Address | string,
  actionValue: bigint | number,
  networkType: 'L1' | 'L2',
  chainId?: number
): { address: Address; abi: typeof REWARD_MANAGER_ABI; functionName: 'distributeReward'; args: [Address, Address, bigint] } | null {
  if (networkType === 'L2') {
    if (!chainId) {
      return null;
    }
    return getRewardDistributionParams(
      chainId,
      userAddress as Address,
      dAppContractAddress as Address,
      actionValue as bigint
    );
  } else {
    // L1 reward distribution - to be implemented
    return null;
  }
}
