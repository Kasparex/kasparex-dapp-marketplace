/**
 * Revenue Tree Types and Interfaces
 * 
 * Defines the data structures for the Revenue Tree System module
 */

export interface RevenueTreeLevel {
  /** Level number (1-5) */
  level: number;
  /** Wallet address for this level */
  walletAddress: string;
  /** Number of users at this level */
  userCount: number;
  /** Revenue share percentage (45, 20, 10, 5, 2) */
  sharePercentage: number;
}

/** Unified tree per wallet per chain (on-chain source of truth). */
export interface UnifiedRevenueTreeData {
  chainId: number;
  userWalletAddress: string;
  /** Upline L1..L5 (L1 = self) */
  upline: [string, string, string, string, string];
  lifetimeVolume: string;
  volumeLast30Days: string;
  isActive: boolean;
  activatedAt: string | null;
  referralLink: string;
  totalEarned: string;
  /** Whether referrer is set on-chain (one-time). */
  referrerSet: boolean;
  /** Referrer address if set. */
  referrer: string | null;
  /** Activation threshold (wei) for display. */
  activationThreshold: string;
  /** Activity threshold (wei) for maintenance. */
  activityThreshold: string;
}

export interface RevenueTreeData {
  /** dApp ID this tree belongs to */
  dappId: string;
  /** dApp slug for URL generation */
  dappSlug: string;
  /** Content type */
  contentType: 'dapp' | 'magazine' | 'vblog' | 'game' | 'store' | 'donation';
  /** Content slug */
  contentSlug: string;
  /** Issue number (for magazines) */
  issueNumber?: number;
  /** The 5 levels of the revenue tree */
  levels: RevenueTreeLevel[];
  /** Total earned in KAS */
  totalEarned: number;
  /** Number of revenue trees with user's address */
  revenueTreesCount: number;
  /** Referral link for this content */
  referralLink: string;
  /** Whether the tree is active */
  isActive: boolean;
  /** User's wallet address */
  userWalletAddress: string;
  /** Date activated */
  activatedAt?: string;
}

/**
 * Revenue share percentages for each level
 */
export const REVENUE_SHARE_PERCENTAGES = {
  LEVEL_05: 45,
  LEVEL_04: 20,
  LEVEL_03: 10,
  LEVEL_02: 5,
  LEVEL_01: 2,
  PLATFORM: 18, // Remainder after all levels
} as const;

/**
 * Content type for revenue tree
 */
export type RevenueTreeContentType = 'dapp' | 'magazine' | 'vblog' | 'game' | 'store' | 'donation';
