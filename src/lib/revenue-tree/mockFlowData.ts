/**
 * Mock Revenue Tree flow data for demo routes: wallet-1 … wallet-6.
 * Matches UnifiedRevenueTreeData shape plus userCount per level (L1..L5).
 * Used by /revenue-tree/flow/[walletAddress] for demo slugs.
 */

import { REVENUE_SHARE_PERCENTAGES } from './types';

const LEVEL_SHARES = [
  REVENUE_SHARE_PERCENTAGES.LEVEL_01,
  REVENUE_SHARE_PERCENTAGES.LEVEL_02,
  REVENUE_SHARE_PERCENTAGES.LEVEL_03,
  REVENUE_SHARE_PERCENTAGES.LEVEL_04,
  REVENUE_SHARE_PERCENTAGES.LEVEL_05,
] as const;

export interface MockFlowTreeData {
  /** Wallet slug (e.g. wallet-1) */
  walletSlug: string;
  /** L1=self, L2..L5 upline */
  upline: [string, string, string, string, string];
  /** User count at each level L1..L5 */
  userCounts: [number, number, number, number, number];
  lifetimeVolume: string;
  volumeLast30Days: string;
  isActive: boolean;
  referrerSet: boolean;
  referrer: string | null;
  chainId: number;
}

const ZERO = '0x0000000000000000000000000000000000000000';
const GEN1 = '0xAb036a6f99892b8B84f1f10a193e4c0d217eB6D3';
const GEN2 = '0xC0CDEC6323A3f079DDB5D9a463AA1470d0b4b201';
const GEN3 = '0x33cE8E3D7039741485C5937fAd2a7e508683bf85';
const GEN4 = '0xa6E0D2Cb51b52e0e864B5231a7C24d6F2379B0e0';
const GEN5 = '0xcde1F107D791327189afdDe98E4eeB2D16D1f7da';

/** Demo wallet addresses (L1 = "this user" per demo). */
const DEMO_L1 = {
  'wallet-1': '0x1111111111111111111111111111111111111111',
  'wallet-2': '0x2222222222222222222222222222222222222222',
  'wallet-3': '0x3333333333333333333333333333333333333333',
  'wallet-4': '0x4444444444444444444444444444444444444444',
  'wallet-5': '0x5555555555555555555555555555555555555555',
  'wallet-6': '0x6666666666666666666666666666666666666666',
} as const;

const MOCK_TREES: MockFlowTreeData[] = [
  {
    walletSlug: 'wallet-1',
    upline: [DEMO_L1['wallet-1'], GEN2, GEN3, GEN4, GEN5],
    userCounts: [1, 0, 0, 0, 0],
    lifetimeVolume: '150000000000000000000',
    volumeLast30Days: '25000000000000000000',
    isActive: true,
    referrerSet: true,
    referrer: GEN2,
    chainId: 167012,
  },
  {
    walletSlug: 'wallet-2',
    upline: [DEMO_L1['wallet-2'], '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', GEN3, GEN4, GEN5],
    userCounts: [1, 3, 0, 0, 0],
    lifetimeVolume: '420000000000000000000',
    volumeLast30Days: '80000000000000000000',
    isActive: true,
    referrerSet: true,
    referrer: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    chainId: 167012,
  },
  {
    walletSlug: 'wallet-3',
    upline: [DEMO_L1['wallet-3'], '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', GEN4, GEN5],
    userCounts: [1, 5, 2, 0, 0],
    lifetimeVolume: '890000000000000000000',
    volumeLast30Days: '120000000000000000000',
    isActive: true,
    referrerSet: true,
    referrer: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    chainId: 167012,
  },
  {
    walletSlug: 'wallet-4',
    upline: [DEMO_L1['wallet-4'], GEN2, GEN3, GEN4, GEN5],
    userCounts: [1, 0, 0, 0, 0],
    lifetimeVolume: '0',
    volumeLast30Days: '0',
    isActive: false,
    referrerSet: false,
    referrer: null,
    chainId: 167012,
  },
  {
    walletSlug: 'wallet-5',
    upline: [DEMO_L1['wallet-5'], '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', GEN5],
    userCounts: [1, 12, 8, 3, 0],
    lifetimeVolume: '2100000000000000000000',
    volumeLast30Days: '340000000000000000000',
    isActive: true,
    referrerSet: true,
    referrer: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    chainId: 167012,
  },
  {
    walletSlug: 'wallet-6',
    upline: [DEMO_L1['wallet-6'], '0x1234567890123456789012345678901234567890', '0x2345678901234567890123456789012345678901', '0x3456789012345678901234567890123456789012', '0x4567890123456789012345678901234567890123'],
    userCounts: [1, 7, 4, 2, 1],
    lifetimeVolume: '560000000000000000000',
    volumeLast30Days: '90000000000000000000',
    isActive: true,
    referrerSet: true,
    referrer: '0x1234567890123456789012345678901234567890',
    chainId: 167012,
  },
];

const DEMO_SLUGS = ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6'] as const;

export function isDemoWalletSlug(slug: string): slug is (typeof DEMO_SLUGS)[number] {
  return DEMO_SLUGS.includes(slug as (typeof DEMO_SLUGS)[number]);
}

export function getMockFlowTree(walletSlug: string): MockFlowTreeData | null {
  return MOCK_TREES.find((t) => t.walletSlug === walletSlug) ?? null;
}

export function getDemoSlugs(): readonly string[] {
  return DEMO_SLUGS;
}

export { LEVEL_SHARES as MOCK_LEVEL_SHARES };
