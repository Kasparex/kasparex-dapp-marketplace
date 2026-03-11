/**
 * Revenue Tree Utility Functions
 * 
 * Helper functions for Revenue Tree activation and wallet management (v5 Design)
 */

import { RevenueTreeLevel, RevenueTreeData, UnifiedRevenueTreeData } from './types';
import { getStoredReferral } from './referral';
import { RevenueTreeContentType } from './types';

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
    isActive: unified.isActiveAtLevel[i] ?? false,
  })).sort((a, b) => b.level - a.level);

  const totalEarnedNum = parseFloat(unified.totalEarned || '0');

  return {
    dappId: 'unified',
    dappSlug: 'revenue-tree',
    contentType: 'dapp',
    contentSlug: 'revenue-tree',
    levels,
    totalEarned: totalEarnedNum, // In Wei right now; components will format it
    revenueTreesCount: 0,
    referralLink: unified.referralLink,
    isActive: unified.isActiveAtLevel[0], // Base L1 activity represents the "active" check
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
 * Generate mock/preview Revenue Tree levels based on referral for users who haven't activated yet.
 * (Production uses unifiedToRevenueTreeData pulling straight from on-chain upline array).
 */
export function generateRevenueTreeLevels(
  userWalletAddress: string | undefined,
  chainId: number,
  contentType: RevenueTreeContentType,
  contentSlug: string,
  referrerAddress: string | null
): RevenueTreeLevel[] {
  const levels: RevenueTreeLevel[] = [
    {
      level: 5,
      walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_5,
      userCount: 0,
      sharePercentage: 45,
      isActive: true,
    },
    {
      level: 4,
      walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_4,
      userCount: 0,
      sharePercentage: 20,
      isActive: true,
    },
    {
      level: 3,
      walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_3,
      userCount: 0,
      sharePercentage: 10,
      isActive: true,
    },
    {
      level: 2,
      walletAddress: DEFAULT_REVENUE_WALLETS.LEVEL_2,
      userCount: 0,
      sharePercentage: 5,
      isActive: true,
    },
    {
      // L1 is the direct referrer now.
      level: 1,
      walletAddress: referrerAddress || DEFAULT_REVENUE_WALLETS.LEVEL_1,
      userCount: 0,
      sharePercentage: 2,
      isActive: true,
    }
  ];
  return levels;
}
