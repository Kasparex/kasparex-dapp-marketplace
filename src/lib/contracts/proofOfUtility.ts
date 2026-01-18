/**
 * ProofOfUtility Contract Integration
 * 
 * Provides utilities for interacting with SecureProofOfUtility contract
 * Handles L2 (EVM) reward distribution with security measures
 */

/**
 * ProofOfUtility Contract Integration
 * 
 * Provides utilities for interacting with SecureProofOfUtility contract
 * Handles L2 (EVM) reward distribution with security measures
 * 
 * Note: These functions return parameters for use with wagmi hooks
 * rather than executing transactions directly
 */

import { Address } from 'viem';
import { getContractAddress } from './addresses';
import { SECURE_PROOF_OF_UTILITY_ABI } from './abis';

/**
 * Get SecureProofOfUtility contract address for a given chain
 */
export function getSecureProofOfUtilityAddress(chainId: number): Address | null {
  const address = getContractAddress(chainId, 'SecureProofOfUtility');
  return address ? (address as Address) : null;
}

/**
 * Get parameters for checking if a dApp contract is authorized
 * Use with useReadContract hook:
 * 
 * ```tsx
 * const { data: isAuthorized } = useReadContract({
 *   ...getDAppAuthorizationParams(chainId, dAppContractAddress)
 * });
 * ```
 */
export function getDAppAuthorizationParams(
  chainId: number,
  dAppContractAddress: Address
): { address: Address; abi: typeof SECURE_PROOF_OF_UTILITY_ABI; functionName: 'authorizedDApps'; args: [Address] } | null {
  const proofOfUtilityAddress = getSecureProofOfUtilityAddress(chainId);
  if (!proofOfUtilityAddress) {
    return null;
  }

  return {
    address: proofOfUtilityAddress,
    abi: SECURE_PROOF_OF_UTILITY_ABI,
    functionName: 'authorizedDApps',
    args: [dAppContractAddress],
  };
}

/**
 * Record usage and distribute reward via SecureProofOfUtility (L2)
 * 
 * @param userAddress User's wallet address
 * @param dAppContractAddress dApp contract address (must be authorized)
 * @param dAppId dApp ID
 * @param actionType Type of action (e.g., 'vote', 'payment')
 * @param actionValue Value of the action for reward calculation
 * @param txHash Transaction hash of the original dApp transaction
 * @param nonce Nonce for replay protection
 * @param chainId Chain ID
 * @returns Success status and transaction hash
 */
export async function recordUsageAndRewardL2(
  userAddress: Address,
  dAppContractAddress: Address,
  dAppId: string,
  actionType: string,
  actionValue: bigint,
  txHash: string,
  nonce: bigint,
  chainId: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const proofOfUtilityAddress = getSecureProofOfUtilityAddress(chainId);
    
    if (!proofOfUtilityAddress) {
      return {
        success: false,
        error: 'SecureProofOfUtility contract address not found for current network',
      };
    }

    // Verify dApp is authorized
    const isAuthorized = await isDAppAuthorized(chainId, dAppContractAddress);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'dApp contract is not authorized to call SecureProofOfUtility',
      };
    }

    // Convert txHash string to bytes32
    const txHashBytes32 = txHash.startsWith('0x') 
      ? (txHash as `0x${string}`)
      : (`0x${txHash}` as `0x${string}`);

    // Call recordUsageAndReward on SecureProofOfUtility
    const hash = await writeContract(config, {
      address: proofOfUtilityAddress,
      abi: SECURE_PROOF_OF_UTILITY_ABI,
      functionName: 'recordUsageAndReward',
      args: [
        userAddress,
        dAppContractAddress,
        BigInt(dAppId),
        actionType,
        actionValue,
        txHashBytes32,
        nonce,
      ],
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
    console.error('Error recording usage and reward (L2):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


/**
 * Generate a unique nonce for replay protection
 * Uses timestamp + random number to ensure uniqueness
 */
export function generateNonce(): bigint {
  const timestamp = BigInt(Date.now());
  const random = BigInt(Math.floor(Math.random() * 1000000));
  return timestamp * BigInt(1000000) + random;
}
