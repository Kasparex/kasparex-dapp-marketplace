/**
 * Revenue Tree Utility Functions
 * 
 * Helper functions for Revenue Tree activation and wallet management
 */

import { RevenueTreeLevel, RevenueTreeData, UnifiedRevenueTreeData } from './types';
import { getStoredReferral } from './referral';
import { RevenueTreeContentType } from './types';
import { formatEther } from 'viem';

/** Share percentages L1..L5 (2, 5, 10, 20, 45). */
const LEVEL_SHARES = [2, 5, 10, 20, 45] as const;

/**
 * Convert on-chain unified tree to legacy RevenueTreeData for existing UI components.
 */
export function unifiedToRevenueTreeData(unified: UnifiedRevenueTreeData | null): RevenueTreeData | null {
  if (!unified) return null;
  const levels: RevenueTreeLevel[] = unified.upline.map((walletAddress, i) => ({
    level: i + 1,
    walletAddress: walletAddress || '',
    userCount: 0,
    sharePercentage: LEVEL_SHARES[i] ?? 0,
  })).sort((a, b) => b.level - a.level);
  const totalEarnedNum = parseFloat(unified.totalEarned || '0');
  return {
    dappId: 'unified',
    dappSlug: 'revenue-tree',
    contentType: 'dapp',
    contentSlug: 'revenue-tree',
    levels,
    totalEarned: totalEarnedNum,
    revenueTreesCount: 0,
    referralLink: unified.referralLink,
    isActive: unified.isActive,
    userWalletAddress: unified.userWalletAddress,
    activatedAt: unified.activatedAt ?? undefined,
  };
}

/**
 * Default revenue share wallets (for genesis/non-referral lists)
 */
export const DEFAULT_REVENUE_WALLETS = {
  LEVEL_5: '0xcde1F107D791327189afdDe98E4eeB2D16D1f7da',
  LEVEL_4: '0xa6E0D2Cb51b52e0e864B5231a7C24d6F2379B0e0',
  LEVEL_3: '0x33cE8E3D7039741485C5937fAd2a7e508683bf85',
  LEVEL_2: '0xC0CDEC6323A3f079DDB5D9a463AA1470d0b4b201',
  LEVEL_1: '0xAb036a6f99892b8B84f1f10a193e4c0d217eB6D3',
  PLATFORM: '0xb9ffC933C681b45F86A50BF5b5f6D067Ff238B19',
} as const;

/**
 * Platform wallet addresses (Treasury contracts)
 * These are used when a user hasn't activated their Revenue Tree yet
 */
export const PLATFORM_WALLETS = {
  // Kasplex L2 Testnet
  167012: DEFAULT_REVENUE_WALLETS.PLATFORM,
  // Kasplex L2 Mainnet
  202555: DEFAULT_REVENUE_WALLETS.PLATFORM,
  // IGRA Galleon Test Mainnet
  38837: DEFAULT_REVENUE_WALLETS.PLATFORM,
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
  
  // If user hasn't activated, show default revenue wallets (genesis list)
  // But if accessed via referral link, show the referrer in level 2
  if (!isActivated || !userWalletAddress) {
    const levels: RevenueTreeLevel[] = [
      {
        level: 5,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_5,
        userCount: 0,
        sharePercentage: 45,
      },
      {
        level: 4,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_4,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 3,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_3,
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
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_2,
        userCount: 0,
        sharePercentage: 5,
      });
    }
    
    // Level 1 is always default wallet when not activated
    levels.push({
      level: 1,
      walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_1,
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
    // For now, use default revenue wallets as placeholders
    levels.push(
      {
        level: 3,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_3,
        userCount: 0,
        sharePercentage: 10,
      },
      {
        level: 4,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_4,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 5,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_5,
        userCount: 0,
        sharePercentage: 45,
      }
    );
  } else {
    // No referral, fill remaining levels with default revenue wallets (genesis list)
    levels.push(
      {
        level: 2,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_2,
        userCount: 0,
        sharePercentage: 5,
      },
      {
        level: 3,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_3,
        userCount: 0,
        sharePercentage: 10,
      },
      {
        level: 4,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_4,
        userCount: 0,
        sharePercentage: 20,
      },
      {
        level: 5,
        walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_5,
        userCount: 0,
        sharePercentage: 45,
      }
    );
  }
  
  // Sort by level (5 to 1)
  return levels.sort((a, b) => b.level - a.level);
}
