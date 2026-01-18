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
 * Get transaction parameters for recordUsageAndReward (for use with wagmi hooks)
 * Returns parameters that can be used with useWriteContract hook
 * 
 * @param userAddress User's wallet address
 * @param dAppContractAddress dApp contract address (must be authorized)
 * @param dAppId dApp ID
 * @param actionType Type of action (e.g., 'vote', 'payment')
 * @param actionValue Value of the action for reward calculation
 * @param txHash Transaction hash of the original dApp transaction
 * @param nonce Nonce for replay protection
 * @param chainId Chain ID
 * @returns Transaction parameters for use with useWriteContract hook, or null if contract address not found
 */
export function getRecordUsageAndRewardL2Params(
  userAddress: Address,
  dAppContractAddress: Address,
  dAppId: string,
  actionType: string,
  actionValue: bigint,
  txHash: string,
  nonce: bigint,
  chainId: number
): { address: Address; abi: typeof SECURE_PROOF_OF_UTILITY_ABI; functionName: 'recordUsageAndReward'; args: [Address, Address, bigint, string, bigint, `0x${string}`, bigint] } | null {
  const proofOfUtilityAddress = getSecureProofOfUtilityAddress(chainId);
  
  if (!proofOfUtilityAddress) {
    return null;
  }

  // Convert txHash string to bytes32
  const txHashBytes32 = txHash.startsWith('0x') 
    ? (txHash as `0x${string}`)
    : (`0x${txHash}` as `0x${string}`);

  return {
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
  };
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
