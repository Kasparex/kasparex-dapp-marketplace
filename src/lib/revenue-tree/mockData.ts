/**
 * Mock Data for Revenue Tree System
 * 
 * Provides sample data for UI development and testing
 */

import { RevenueTreeData, RevenueTreeLevel } from './types';

/**
 * Generate mock revenue tree data for a dApp
 */
export function generateMockRevenueTree(
  dappId: string,
  dappSlug: string,
  userWalletAddress: string,
  isActive: boolean = true
): RevenueTreeData {
  const levels: RevenueTreeLevel[] = [
    {
      level: 5,
      walletAddress: 'kaspa:qtre...john',
      userCount: 0,
      sharePercentage: 45,
    },
    {
      level: 4,
      walletAddress: 'kaspa:qtre...mark',
      userCount: 0,
      sharePercentage: 20,
    },
    {
      level: 3,
      walletAddress: 'kaspa:qtre...paul',
      userCount: 0,
      sharePercentage: 10,
    },
    {
      level: 2,
      walletAddress: 'kaspa:qtre...eric',
      userCount: 0,
      sharePercentage: 5,
    },
    {
      level: 1,
      walletAddress: userWalletAddress,
      userCount: 0,
      sharePercentage: 2,
    },
  ];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl}/dapps/${dappSlug}?ref=${userWalletAddress}`;

  return {
    dappId,
    dappSlug,
    contentType: 'dapp',
    contentSlug: dappSlug,
    levels,
    totalEarned: isActive ? 2625.0 : 0,
    revenueTreesCount: isActive ? 137 : 0,
    referralLink,
    isActive,
    userWalletAddress,
    activatedAt: isActive ? new Date().toISOString() : undefined,
  };
}

/**
 * Generate mock revenue tree for a magazine issue
 */
export function generateMockMagazineRevenueTree(
  magazineSlug: string,
  issueNumber: number,
  userWalletAddress: string,
  isActive: boolean = true
): RevenueTreeData {
  const levels: RevenueTreeLevel[] = [
    {
      level: 5,
      walletAddress: 'kaspa:qtre...alex',
      userCount: 2,
      sharePercentage: 45,
    },
    {
      level: 4,
      walletAddress: 'kaspa:qtre...john',
      userCount: 60,
      sharePercentage: 20,
    },
    {
      level: 3,
      walletAddress: 'kaspa:qtre...mark',
      userCount: 35,
      sharePercentage: 10,
    },
    {
      level: 2,
      walletAddress: 'kaspa:qtre...paul',
      userCount: 15,
      sharePercentage: 5,
    },
    {
      level: 1,
      walletAddress: userWalletAddress,
      userCount: 5,
      sharePercentage: 2,
    },
  ];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl}/magazines/${magazineSlug}/${issueNumber}?ref=${userWalletAddress}`;

  return {
    dappId: `magazine-${magazineSlug}-${issueNumber}`,
    dappSlug: magazineSlug,
    contentType: 'magazine',
    contentSlug: magazineSlug,
    issueNumber,
    levels,
    totalEarned: isActive ? 1206.0 : 0,
    revenueTreesCount: isActive ? 1 : 0,
    referralLink,
    isActive,
    userWalletAddress,
    activatedAt: isActive ? new Date().toISOString() : undefined,
  };
}

/**
 * Get all mock revenue trees for a user
 */
export function getAllMockRevenueTrees(userWalletAddress: string): RevenueTreeData[] {
  return [
    generateMockRevenueTree('simple-payment', 'simple-payment', userWalletAddress, true),
    generateMockRevenueTree('8', 'voting-tournament-tool', userWalletAddress, false),
    generateMockMagazineRevenueTree('kaspa-insider', 1, userWalletAddress, true),
  ];
}
