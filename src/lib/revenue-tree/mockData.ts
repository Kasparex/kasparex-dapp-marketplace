/**
 * Mock Data for Revenue Tree System
 * 
 * Provides sample data for UI development and testing
 */

import { RevenueTreeData, RevenueTreeLevel } from './types';
import { generateRevenueTreeLevels } from './utils';
import { getStoredReferral } from './referral';

/**
 * Generate mock revenue tree data for a dApp
 */
export function generateMockRevenueTree(
  dappId: string,
  dappSlug: string,
  userWalletAddress: string | undefined,
  chainId: number = 167012,
  isActive: boolean = true
): RevenueTreeData {
  const contentType = 'dapp';

  // Check if user has activated
  const isActivated = userWalletAddress ? true : false;

  // Get referral address if exists
  const referrerAddress = typeof window !== 'undefined' ? getStoredReferral(contentType, dappSlug) : null;

  // Generate levels based on activation status and referral chain
  const levels = generateRevenueTreeLevels(
    userWalletAddress,
    chainId,
    contentType,
    dappSlug,
    referrerAddress
  );

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = userWalletAddress
    ? `${baseUrl}/dapps/${dappSlug}?ref=${userWalletAddress}`
    : `${baseUrl}/dapps/${dappSlug}`;

  return {
    dappId,
    dappSlug,
    contentType: 'dapp',
    contentSlug: dappSlug,
    levels,
    totalEarned: isActive && isActivated ? 2625.0 : 0,
    revenueTreesCount: isActive && isActivated ? 137 : 0,
    referralLink,
    isActive: isActivated,
    userWalletAddress: userWalletAddress || '',
    activatedAt: isActivated ? new Date().toISOString() : undefined,
  };
}

/**
 * Generate mock revenue tree for a magazine issue
 */
export function generateMockMagazineRevenueTree(
  magazineSlug: string,
  issueNumber: number,
  userWalletAddress: string | undefined,
  chainId: number = 167012,
  isActive: boolean = true
): RevenueTreeData {
  const contentType = 'magazine';

  // Check if user has activated
  const isActivated = userWalletAddress ? true : false;

  // Get referral address if exists
  const referrerAddress = typeof window !== 'undefined' ? getStoredReferral(contentType, magazineSlug) : null;

  // Generate levels based on activation status and referral chain
  const levels = generateRevenueTreeLevels(
    userWalletAddress,
    chainId,
    contentType,
    magazineSlug,
    referrerAddress
  );

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = userWalletAddress
    ? `${baseUrl}/magazines/${magazineSlug}/${issueNumber}?ref=${userWalletAddress}`
    : `${baseUrl}/magazines/${magazineSlug}/${issueNumber}`;

  return {
    dappId: `magazine-${magazineSlug}-${issueNumber}`,
    dappSlug: magazineSlug,
    contentType: 'magazine',
    contentSlug: magazineSlug,
    issueNumber,
    levels,
    totalEarned: isActive && isActivated ? 1206.0 : 0,
    revenueTreesCount: isActive && isActivated ? 1 : 0,
    referralLink,
    isActive: isActivated,
    userWalletAddress: userWalletAddress || '',
    activatedAt: isActivated ? new Date().toISOString() : undefined,
  };
}

/**
 * Generate revenue tree data for a donation campaign (contentType 'donation', contentSlug = creatorAddress).
 */
export function generateDonationRevenueTree(
  creatorAddress: string,
  userWalletAddress: string | undefined,
  chainId: number = 38836,
  isActive: boolean = true
): RevenueTreeData {
  const contentType = 'donation';
  const isActivated = userWalletAddress ? true : false;
  const referrerAddress = typeof window !== 'undefined' ? getStoredReferral(contentType, creatorAddress) : null;
  const levels = generateRevenueTreeLevels(
    userWalletAddress,
    chainId,
    contentType,
    creatorAddress,
    referrerAddress
  );
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = userWalletAddress
    ? `${baseUrl}/donations/${creatorAddress}?ref=${userWalletAddress}`
    : `${baseUrl}/donations/${creatorAddress}`;

  return {
    dappId: `donation-${creatorAddress}`,
    dappSlug: creatorAddress,
    contentType: 'donation',
    contentSlug: creatorAddress,
    levels,
    totalEarned: isActive && isActivated ? 0 : 0,
    revenueTreesCount: isActive && isActivated ? 1 : 0,
    referralLink,
    isActive: isActivated,
    userWalletAddress: userWalletAddress || '',
    activatedAt: isActivated ? new Date().toISOString() : undefined,
  };
}

/**
 * Get all mock revenue trees for a user
 */
export function getAllMockRevenueTrees(userWalletAddress: string | undefined, chainId: number = 167012): RevenueTreeData[] {
  return [
    generateMockRevenueTree('simple-payment', 'simple-payment', userWalletAddress, chainId, true),
    generateMockRevenueTree('8', 'voting-tournament-tool', userWalletAddress, chainId, false),
    generateMockMagazineRevenueTree('kaspa-insider', 1, userWalletAddress, chainId, true),
  ];
}
