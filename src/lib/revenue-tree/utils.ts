/**
 * Revenue Tree Utility Functions
 * 
 * Helper functions for Revenue Tree activation and wallet management
 */

import { RevenueTreeLevel } from './types';
import { getStoredReferral } from './referral';
import { RevenueTreeContentType } from './types';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';

/**
 * Platform wallet addresses (Treasury contracts)
 * These are used when a user hasn't activated their Revenue Tree yet
 */
export const PLATFORM_WALLETS = {
  // Kasplex L2 Testnet
  167012: '0x305B4ee627aD8b12bFCF6427453964771aA30622',
  // Kasplex L2 Mainnet
  202555: '0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40',
  // IGRA Galleon Test Mainnet
  38837: '0x0000000000000000000000000000000000000000', // TODO: Update when deployed
} as const;

/**
 * Get platform wallet address for a chain
 */
export function getPlatformWallet(chainId: number): string {
  return PLATFORM_WALLETS[chainId as keyof typeof PLATFORM_WALLETS] || PLATFORM_WALLETS[167012];
}

/**
 * Check if user has activated Revenue Tree for a content item
 * This checks if they've spent at least 100 KAS on the dApp
 * 
 * TODO: Replace with actual contract/backend check
 */
export function hasUserActivated(
  userWalletAddress: string | undefined,
  contentType: RevenueTreeContentType,
  contentSlug: string
): boolean {
  if (!userWalletAddress) return false;
  
  // Check localStorage for activation status
  // In production, this should check the contract/backend
  const activationKey = `revenue_tree_activated:${contentType}:${contentSlug}:${userWalletAddress}`;
  const activated = typeof window !== 'undefined' ? localStorage.getItem(activationKey) : null;
  
  return activated === 'true';
}

/**
 * Mark user as activated for a content item
 */
export function markUserActivated(
  userWalletAddress: string,
  contentType: RevenueTreeContentType,
  contentSlug: string
): void {
  if (typeof window === 'undefined') return;
  
  const activationKey = `revenue_tree_activated:${contentType}:${contentSlug}:${userWalletAddress}`;
  localStorage.setItem(activationKey, 'true');
}

/**
 * Generate Revenue Tree levels based on activation status and referral chain
 */
export function generateRevenueTreeLevels(
  userWalletAddress: string | undefined,
  chainId: number,
  contentType: RevenueTreeContentType,
  contentSlug: string,
  referrerAddress: string | null
): RevenueTreeLevel[] {
  const isActivated = userWalletAddress ? hasUserActivated(userWalletAddress, contentType, contentSlug) : false;
  const platformWallet = getPlatformWallet(chainId);
  
  // If user hasn't activated, show platform wallets
  // But if accessed via referral link, show the referrer in level 2
  if (!isActivated || !userWalletAddress) {
    const levels: RevenueTreeLevel[] = [
      {
        level: 5,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 45,
      },
      {
        level: 4,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 3,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 10,
      },
    ];
    
    // If accessed via referral link, show referrer at level 2
    if (referrerAddress) {
      levels.push({
        level: 2,
        walletAddress: referrerAddress,
        userCount: 0,
        sharePercentage: 5,
      });
    } else {
      levels.push({
        level: 2,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 5,
      });
    }
    
    // Level 1 is always platform wallet when not activated
    levels.push({
      level: 1,
      walletAddress: platformWallet,
      userCount: 0,
      sharePercentage: 2,
    });
    
    return levels;
  }
  
  // If user has activated, build the referral chain
  // Level 1 is always the current user
  // Levels 2-5 come from the referral chain (if accessed via referral link)
  const levels: RevenueTreeLevel[] = [
    {
      level: 1,
      walletAddress: userWalletAddress,
      userCount: 0,
      sharePercentage: 2,
    },
  ];
  
  // If accessed via referral link, build the upline chain
  // For now, we'll use mock addresses for levels 2-5
  // In production, this should come from the contract/backend
  if (referrerAddress) {
    // Level 2 is the direct referrer
    levels.push({
      level: 2,
      walletAddress: referrerAddress,
      userCount: 0,
      sharePercentage: 5,
    });
    
    // Levels 3-5 would come from the referrer's upline chain
    // For now, use platform wallets as placeholders
    levels.push(
      {
        level: 3,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 10,
      },
      {
        level: 4,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 5,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 45,
      }
    );
  } else {
    // No referral, fill remaining levels with platform wallets
    levels.push(
      {
        level: 2,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 5,
      },
      {
        level: 3,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 10,
      },
      {
        level: 4,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 5,
        walletAddress: platformWallet,
        userCount: 0,
        sharePercentage: 45,
      }
    );
  }
  
  // Sort by level (5 to 1)
  return levels.sort((a, b) => b.level - a.level);
}
