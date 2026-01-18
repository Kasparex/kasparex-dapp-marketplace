/**
 * Reward Distribution System
 * 
 * Handles automatic reward distribution after successful transactions
 * Works with existing RewardManager contract for L2
 */

import { Address } from 'viem';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
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
 * Distribute rewards for L2 (EVM) transactions
 * Uses RewardManager contract to distribute GRID or dApp tokens
 */
export async function distributeRewardL2(
  userAddress: Address,
  dAppContractAddress: Address,
  actionValue: bigint
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const chainId = useChainId();
    const rewardManagerAddress = getContractAddress(chainId, 'RewardManager');
    
    if (!rewardManagerAddress) {
      return {
        success: false,
        error: 'RewardManager contract address not found for current network',
      };
    }
    
    // Call distributeReward on RewardManager contract
    const hash = await writeContract(config, {
      address: rewardManagerAddress as Address,
      abi: REWARD_MANAGER_ABI,
      functionName: 'distributeReward',
      args: [userAddress, dAppContractAddress, actionValue],
    });
    
    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(config, { hash });
    
    if (receipt.status === 'success') {
      return {
        success: true,
        txHash: hash,
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
      };
    }
  } catch (error) {
    console.error('Error distributing reward (L2):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
 * Distribute rewards automatically based on network type
 */
export async function distributeReward(
  userAddress: Address | string,
  dAppContractAddress: Address | string,
  actionValue: bigint | number,
  networkType: 'L1' | 'L2',
  chainId?: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (networkType === 'L2') {
    if (!chainId) {
      return {
        success: false,
        error: 'Chain ID required for L2 reward distribution',
      };
    }
    return distributeRewardL2(
      userAddress as Address,
      dAppContractAddress as Address,
      actionValue as bigint,
      chainId
    );
  } else {
    return distributeRewardL1(
      userAddress as string,
      dAppContractAddress as string,
      actionValue as number
    );
  }
}
