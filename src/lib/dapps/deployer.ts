'use client';

import { useProfile } from '@/hooks/useProfile';

/**
 * Check if connected address matches deployer address
 */
export function isDeployer(connectedAddress: string | undefined, deployerAddress: string | undefined): boolean {
  if (!connectedAddress || !deployerAddress) {
    return false;
  }
  return connectedAddress.toLowerCase() === deployerAddress.toLowerCase();
}

/**
 * Get deployer profile using existing useProfile hook
 * Returns profile data and emoji
 */
export function useDeployerProfile(deployerAddress: string | undefined) {
  return useProfile(deployerAddress);
}

/**
 * Format deployer name (last 5 digits or displayName)
 */
export function formatDeployerName(deployerAddress: string | undefined, profile: { displayName?: string } | null): string {
  if (!deployerAddress) {
    return 'Unknown';
  }
  
  if (profile?.displayName) {
    return profile.displayName;
  }
  
  // Return last 5 digits
  return deployerAddress.slice(-5);
}

/**
 * Generate link to deployer profile
 */
export function getDeployerProfileUrl(deployerAddress: string | undefined): string {
  if (!deployerAddress) {
    return '#';
  }
  return `/user/${deployerAddress}`;
}

/**
 * Get explorer URL for contract address
 */
export function getExplorerUrl(contractAddress: string, chainId: number): string {
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    return '#';
  }

  if (chainId === 167012) {
    // Testnet
    return `https://explorer.testnet.kasplextest.xyz/address/${contractAddress}`;
  } else if (chainId === 202555) {
    // Mainnet
    return `https://explorer.kasplex.org/address/${contractAddress}`;
  }

  return '#';
}

