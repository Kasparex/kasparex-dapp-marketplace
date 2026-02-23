/**
 * Mock Revenue Tree flow data for demo routes: A (wallet-1), B (wallet-2), … F (wallet-6).
 * Chain: A activated first, B through A, C through B, D through C, E through D, F through E.
 * Upline push-up: when B activates, B's tree = L1=B, L2=A, L3=Gen, L4=Gen, L5=Gen; etc.
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
  /** Wallet slug (wallet-1 … wallet-6); display label A … F */
  walletSlug: string;
  /** L1=self, L2..L5 upline (pushed up at activation) */
  upline: [string, string, string, string, string];
  /** Number of active trees where this wallet appears at each level (L1..L5). You earn this level's share from those trees' payments. */
  treesWhereOwnerAtLevel: [number, number, number, number, number];
  lifetimeVolume: string;
  volumeLast30Days: string;
  isActive: boolean;
  referrerSet: boolean;
  referrer: string | null;
  chainId: number;
  /** Total KAS spent by tree (demo). */
  totalTreeVolume?: string;
  /** Volume per level L1..L5 (wei). */
  volumePerLevel?: [string, string, string, string, string];
  /** Estimated revenue (wei) for this wallet at each level (share% × volume from trees where owner at that level). L1..L5. */
  revenueShareByLevelWei?: [string, string, string, string, string];
  /** Tree slugs (wallet-1 … wallet-6) where this wallet appears at each level L1..L5. Used for modal "open this tree" links. */
  treeSlugsWhereOwnerAtLevel?: [string[], string[], string[], string[], string[]];
}

const GEN1 = '0xAb036a6f99892b8B84f1f10a193e4c0d217eB6D3';
const GEN2 = '0xC0CDEC6323A3f079DDB5D9a463AA1470d0b4b201';
const GEN3 = '0x33cE8E3D7039741485C5937fAd2a7e508683bf85';
const GEN4 = '0xa6E0D2Cb51b52e0e864B5231a7C24d6F2379B0e0';
const GEN5 = '0xcde1F107D791327189afdDe98E4eeB2D16D1f7da';

const ADDR_A = '0x1111111111111111111111111111111111111111';
const ADDR_B = '0x2222222222222222222222222222222222222222';
const ADDR_C = '0x3333333333333333333333333333333333333333';
const ADDR_D = '0x4444444444444444444444444444444444444444';
const ADDR_E = '0x5555555555555555555555555555555555555555';
const ADDR_F = '0x6666666666666666666666666666666666666666';
const ADDR_G = '0x7777777777777777777777777777777777777777';
const ADDR_H = '0x8888888888888888888888888888888888888888';
const ADDR_I = '0x9999999999999999999999999999999999999999';

function wei(kas: number): string {
  return BigInt(Math.round(kas * 1e18)).toString();
}

// A: 150, B: 420, C: 890, D: 200, E: 310, F: 100, G: 50, H: 80, I: 60 KAS
const VOL_A = wei(150);
const VOL_B = wei(420);
const VOL_C = wei(890);
const VOL_D = wei(200);
const VOL_E = wei(310);
const VOL_F = wei(100);
const VOL_G = wei(50);
const VOL_H = wei(80);
const VOL_I = wei(60);

const MOCK_TREES: MockFlowTreeData[] = [
  {
    walletSlug: 'wallet-1',
    upline: [ADDR_A, GEN1, GEN2, GEN3, GEN4],
    treesWhereOwnerAtLevel: [1, 3, 2, 1, 1],
    lifetimeVolume: VOL_A,
    volumeLast30Days: wei(25),
    isActive: true,
    referrerSet: false,
    referrer: null,
    chainId: 167012,
    totalTreeVolume: wei(2300),
    volumePerLevel: [VOL_A, wei(420 + 50 + 80), wei(890 + 60), VOL_D, VOL_E],
    revenueShareByLevelWei: [wei(3), wei(27.5), wei(38), wei(40), wei(139.5)],
    treeSlugsWhereOwnerAtLevel: [['wallet-1'], ['wallet-2', 'wallet-7', 'wallet-8'], ['wallet-3', 'wallet-9'], ['wallet-4'], ['wallet-5']],
  },
  {
    walletSlug: 'wallet-2',
    upline: [ADDR_B, ADDR_A, GEN1, GEN2, GEN3],
    treesWhereOwnerAtLevel: [1, 2, 1, 1, 1],
    lifetimeVolume: VOL_B,
    volumeLast30Days: wei(80),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_A,
    chainId: 167012,
    totalTreeVolume: wei(1980),
    volumePerLevel: [VOL_B, wei(890 + 60), VOL_D, VOL_E, VOL_F],
    revenueShareByLevelWei: [wei(8.4), wei(47.5), wei(20), wei(62), wei(45)],
    treeSlugsWhereOwnerAtLevel: [['wallet-2'], ['wallet-3', 'wallet-9'], ['wallet-4'], ['wallet-5'], ['wallet-6']],
  },
  {
    walletSlug: 'wallet-3',
    upline: [ADDR_C, ADDR_B, ADDR_A, GEN1, GEN2],
    treesWhereOwnerAtLevel: [1, 1, 1, 1, 0],
    lifetimeVolume: VOL_C,
    volumeLast30Days: wei(120),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_B,
    chainId: 167012,
    totalTreeVolume: wei(1500),
    volumePerLevel: [VOL_C, VOL_D, VOL_E, VOL_F, '0'],
    revenueShareByLevelWei: [wei(17.8), wei(10), wei(31), wei(45), '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-3'], ['wallet-4'], ['wallet-5'], [], []],
  },
  {
    walletSlug: 'wallet-4',
    upline: [ADDR_D, ADDR_C, ADDR_B, ADDR_A, GEN1],
    treesWhereOwnerAtLevel: [1, 1, 1, 0, 0],
    lifetimeVolume: VOL_D,
    volumeLast30Days: wei(20),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_C,
    chainId: 167012,
    totalTreeVolume: wei(610),
    volumePerLevel: [VOL_D, VOL_E, VOL_F, '0', '0'],
    revenueShareByLevelWei: [wei(4), wei(15.5), wei(10), '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-4'], ['wallet-5'], ['wallet-6'], [], []],
  },
  {
    walletSlug: 'wallet-5',
    upline: [ADDR_E, ADDR_D, ADDR_C, ADDR_B, ADDR_A],
    treesWhereOwnerAtLevel: [1, 1, 0, 0, 0],
    lifetimeVolume: VOL_E,
    volumeLast30Days: wei(34),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_D,
    chainId: 167012,
    totalTreeVolume: wei(410),
    volumePerLevel: [VOL_E, VOL_F, '0', '0', '0'],
    revenueShareByLevelWei: [wei(6.2), wei(5), '0', '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-5'], ['wallet-6'], [], [], []],
  },
  {
    walletSlug: 'wallet-6',
    upline: [ADDR_F, ADDR_E, ADDR_D, ADDR_C, ADDR_B],
    treesWhereOwnerAtLevel: [1, 0, 0, 0, 0],
    lifetimeVolume: VOL_F,
    volumeLast30Days: wei(9),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_E,
    chainId: 167012,
    totalTreeVolume: VOL_F,
    volumePerLevel: [VOL_F, '0', '0', '0', '0'],
    revenueShareByLevelWei: [wei(2), '0', '0', '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-6'], [], [], [], []],
  },
  {
    walletSlug: 'wallet-7',
    upline: [ADDR_G, ADDR_A, GEN1, GEN2, GEN3],
    treesWhereOwnerAtLevel: [1, 1, 0, 0, 0],
    lifetimeVolume: VOL_G,
    volumeLast30Days: wei(12),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_A,
    chainId: 167012,
    totalTreeVolume: VOL_G,
    volumePerLevel: [VOL_G, '0', '0', '0', '0'],
    revenueShareByLevelWei: [wei(1), '0', '0', '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-7'], [], [], [], []],
  },
  {
    walletSlug: 'wallet-8',
    upline: [ADDR_H, ADDR_A, GEN1, GEN2, GEN3],
    treesWhereOwnerAtLevel: [1, 1, 0, 0, 0],
    lifetimeVolume: VOL_H,
    volumeLast30Days: wei(18),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_A,
    chainId: 167012,
    totalTreeVolume: VOL_H,
    volumePerLevel: [VOL_H, '0', '0', '0', '0'],
    revenueShareByLevelWei: [wei(1.6), '0', '0', '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-8'], [], [], [], []],
  },
  {
    walletSlug: 'wallet-9',
    upline: [ADDR_I, ADDR_B, ADDR_A, GEN1, GEN2],
    treesWhereOwnerAtLevel: [1, 1, 1, 0, 0],
    lifetimeVolume: VOL_I,
    volumeLast30Days: wei(8),
    isActive: true,
    referrerSet: true,
    referrer: ADDR_B,
    chainId: 167012,
    totalTreeVolume: VOL_I,
    volumePerLevel: [VOL_I, '0', '0', '0', '0'],
    revenueShareByLevelWei: [wei(1.2), '0', '0', '0', '0'],
    treeSlugsWhereOwnerAtLevel: [['wallet-9'], [], [], [], []],
  },
];

const DEMO_SLUGS = ['wallet-1', 'wallet-2', 'wallet-3', 'wallet-4', 'wallet-5', 'wallet-6', 'wallet-7', 'wallet-8', 'wallet-9'] as const;
export const DEMO_LABELS: Record<string, string> = {
  'wallet-1': 'A',
  'wallet-2': 'B',
  'wallet-3': 'C',
  'wallet-4': 'D',
  'wallet-5': 'E',
  'wallet-6': 'F',
  'wallet-7': 'G',
  'wallet-8': 'H',
  'wallet-9': 'I',
};

export function isDemoWalletSlug(slug: string): slug is (typeof DEMO_SLUGS)[number] {
  return DEMO_SLUGS.includes(slug as (typeof DEMO_SLUGS)[number]);
}

export function getMockFlowTree(walletSlug: string): MockFlowTreeData | null {
  return MOCK_TREES.find((t) => t.walletSlug === walletSlug) ?? null;
}

export function getDemoSlugs(): readonly string[] {
  return DEMO_SLUGS;
}

const ADDR_TO_LABEL: Record<string, string> = {
  [ADDR_A.toLowerCase()]: 'A',
  [ADDR_B.toLowerCase()]: 'B',
  [ADDR_C.toLowerCase()]: 'C',
  [ADDR_D.toLowerCase()]: 'D',
  [ADDR_E.toLowerCase()]: 'E',
  [ADDR_F.toLowerCase()]: 'F',
  [ADDR_G.toLowerCase()]: 'G',
  [ADDR_H.toLowerCase()]: 'H',
  [ADDR_I.toLowerCase()]: 'I',
};

export function getDemoWalletLabel(addr: string): string | null {
  if (!addr) return null;
  return ADDR_TO_LABEL[addr.toLowerCase()] ?? null;
}

export { LEVEL_SHARES as MOCK_LEVEL_SHARES };
