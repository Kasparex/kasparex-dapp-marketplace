'use client';

import { useProfile } from '@/hooks/useProfile';
import { getAdminAddresses } from '@/lib/admin';
import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';

const PLACEHOLDER_DEVELOPER_NAMES = new Set(['kasparex', 'community', 'unknown', '']);

/**
 * Resolve the publisher/deployer of a dApp for the standard author credit.
 *
 * Priority: community lister (submitterAddress) -> L1 official Kasparex treasury ->
 * L2 on-chain deployer / developer 0x / admin. `name` is only returned when a real
 * custom developer name is set (overriding the address).
 */
export function resolveDAppAuthor(dapp: DApp): { wallet: string | null; name?: string } {
  const developer = dapp.developer?.trim();
  const isPlaceholder =
    !developer ||
    developer.startsWith('0x') ||
    PLACEHOLDER_DEVELOPER_NAMES.has(developer.toLowerCase());
  const name = isPlaceholder ? undefined : developer;

  const submitter = dapp.directoryListing?.submitterAddress?.trim();
  if (submitter) {
    return { wallet: submitter, name };
  }

  // Official L1 dApps credit the Kasparex treasury (Kaspa L1), not the EVM admin.
  if (getDAppNetworkType(dapp) === 'L1') {
    return { wallet: getKasparexGamesAuthorWallet(), name };
  }

  // L2: deployer / developer wallet / Kasparex admin.
  const officialDeployer =
    dapp.source !== 'directory' ? getAdminAddresses()[0] ?? null : null;

  const wallet =
    dapp.deployerAddress ||
    (developer && developer.startsWith('0x') ? developer : null) ||
    officialDeployer ||
    null;

  return { wallet, name };
}

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
 * Check if a string is a valid wallet address (Ethereum format)
 */
function isValidWalletAddress(address: string | undefined): boolean {
  if (!address) return false;
  // Ethereum address format: 0x followed by 40 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Generate link to deployer profile
 * Always uses wallet address format, never display names
 */
export function getDeployerProfileUrl(deployerAddress: string | undefined): string {
  if (!deployerAddress) {
    return '#';
  }
  
  // Only use if it's a valid wallet address
  // This ensures we never use display names in URLs
  if (!isValidWalletAddress(deployerAddress)) {
    console.warn('Invalid wallet address for deployer URL:', deployerAddress);
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
    // Kasplex L2 Testnet
    return `https://explorer.testnet.kasplextest.xyz/address/${contractAddress}`;
  } else if (chainId === 202555) {
    // Kasplex L2 Mainnet
    return `https://explorer.kasplex.org/address/${contractAddress}`;
  } else if (chainId === 38836) {
    return `https://explorer.galleon-testnet.igralabs.com/address/${contractAddress}`;
  } else if (chainId === 38833) {
    return `https://explorer.igralabs.com/address/${contractAddress}`;
  }

  return '#';
}

/**
 * Get block explorer URL for a transaction (EVM tx hash) by chain ID
 */
export function getExplorerTxUrlForChain(chainId: number, txHash: string): string {
  if (!txHash || !txHash.startsWith('0x')) return '#';
  if (chainId === 167012) {
    return `https://explorer.testnet.kasplextest.xyz/tx/${txHash}`;
  }
  if (chainId === 202555) {
    return `https://explorer.kasplex.org/tx/${txHash}`;
  }
  if (chainId === 38836) {
    return `https://explorer.galleon-testnet.igralabs.com/tx/${txHash}`;
  }
  if (chainId === 38833) {
    return `https://explorer.igralabs.com/tx/${txHash}`;
  }
  return '#';
}

