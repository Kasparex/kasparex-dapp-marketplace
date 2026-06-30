/**
 * Dashboard Data Utilities
 * Aggregates all rewards, benefits, and premium features for the rewards dashboard
 */

import {
  KREX_TIERS,
  NFT_MULTIPLIER,
  DIAMOND_NFT_MULTIPLIER,
  RAREST_NFT_MULTIPLIER,
  NFT_FEE_REDUCTION,
  DIAMOND_NFT_FEE_REDUCTION,
  RAREST_NFT_FEE_REDUCTION,
  DEFAULT_NODE_MULTIPLIER,
  DEFAULT_NODE_FEE_REDUCTION,
  type KREXTier,
  type NFTStatus,
} from './types';
import { NFT_POINTS } from '@/lib/nft/points';
import { formatLargeNumber } from './calculator';

export interface RewardItem {
  id: string;
  type: 'krex-tier' | 'nft' | 'node' | 'premium';
  name: string;
  description: string;
  requirement: string;
  multiplier?: number;
  feeReduction?: number;
  points?: number;
  benefits: string[];
  isUnlocked: boolean;
  userStatus?: string;
}

export interface UserRewardStatus {
  krexTier: KREXTier;
  krexBalance: number;
  nftStatus: NFTStatus;
  hasNode: boolean;
  nodeType?: 'light' | 'mirror';
}

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1 },
  mirror: { name: 'Mirror Node', multiplier: 5, feeReduction: 0.2 },
};

/**
 * Get all KREX tier rewards
 */
export function getAllKREXTierRewards(): RewardItem[] {
  return Object.values(KREX_TIERS).map((tier) => ({
    id: `krex-${tier.tier}`,
    type: 'krex-tier' as const,
    name: tier.label,
    description: tier.tier === 'Tier0' ? 'No KREX held' : `Hold at least ${formatLargeNumber(tier.minKREX)} KREX tokens`,
    requirement: tier.tier === 'Tier0' ? 'No KREX' : `≥ ${formatLargeNumber(tier.minKREX)} KREX`,
    multiplier: tier.multiplier,
    feeReduction: tier.feeDiscountPercent,
    points: undefined,
    benefits: tier.tier === 'Tier0'
      ? ['No fee discount', 'No Hub Points multiplier']
      : [
          `${tier.feeDiscountPercent}% off fees`,
          `${tier.pointsMultiplier > 0 ? `${tier.pointsMultiplier}x` : 'No'} Hub Points multiplier`,
          `${tier.multiplier > 0 ? `${tier.multiplier}x` : 'No'} GRID multiplier (calculator)`,
        ],
    isUnlocked: false, // Will be set by getUserRewardStatus
    userStatus: undefined,
  }));
}

/**
 * Get all NFT rewards
 */
export function getAllNFTRewards(): RewardItem[] {
  return [
    {
      id: 'nft-regular',
      type: 'nft' as const,
      name: 'Regular NFT',
      description: 'Hold at least 1 NFT from KREXPRIME or PIXELKREX collections',
      requirement: '1+ Regular NFT (KREXPRIME or PIXELKREX)',
      multiplier: NFT_MULTIPLIER,
      feeReduction: NFT_FEE_REDUCTION,
      points: NFT_POINTS.REGULAR,
      benefits: [
        `+${NFT_MULTIPLIER}x reward multiplier`,
        `-${NFT_FEE_REDUCTION}% fee reduction`,
        `${NFT_POINTS.REGULAR} point per NFT`,
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
    {
      id: 'nft-diamond',
      type: 'nft' as const,
      name: 'Diamond NFT',
      description: 'Hold at least 1 Diamond NFT from any collection',
      requirement: '1+ Diamond NFT (any collection)',
      multiplier: DIAMOND_NFT_MULTIPLIER,
      feeReduction: DIAMOND_NFT_FEE_REDUCTION,
      points: NFT_POINTS.DIAMOND,
      benefits: [
        `+${DIAMOND_NFT_MULTIPLIER}x reward multiplier`,
        `-${DIAMOND_NFT_FEE_REDUCTION}% fee reduction`,
        `${NFT_POINTS.DIAMOND} points per Diamond NFT`,
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
    {
      id: 'nft-rarest',
      type: 'nft' as const,
      name: 'Rarest NFT',
      description: 'Hold the rarest NFT (#515 PIXELKREX or #345 KREXPRIME)',
      requirement: 'Rarest NFT (#515 PIXELKREX or #345 KREXPRIME)',
      multiplier: RAREST_NFT_MULTIPLIER,
      feeReduction: RAREST_NFT_FEE_REDUCTION,
      points: NFT_POINTS.RAREST,
      benefits: [
        `+${RAREST_NFT_MULTIPLIER}x reward multiplier`,
        `Zero-fee mode (100% fee reduction)`,
        `${NFT_POINTS.RAREST} points`,
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
  ];
}

/**
 * Get all node provider rewards
 */
export function getAllNodeRewards(): RewardItem[] {
  return [
    {
      id: 'node-light',
      type: 'node' as const,
      name: NODE_TYPES.light.name,
      description: 'Run a Light Node to support the Kasparex Mesh network',
      requirement: 'Active Light Node',
      multiplier: NODE_TYPES.light.multiplier,
      feeReduction: NODE_TYPES.light.feeReduction,
      points: undefined,
      benefits: [
        `${NODE_TYPES.light.multiplier}x reward multiplier`,
        `-${NODE_TYPES.light.feeReduction}% fee reduction`,
        'Support network infrastructure',
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
    {
      id: 'node-mirror',
      type: 'node' as const,
      name: NODE_TYPES.mirror.name,
      description: 'Run a Mirror Node to support the Kasparex Mesh network',
      requirement: 'Active Mirror Node',
      multiplier: NODE_TYPES.mirror.multiplier,
      feeReduction: NODE_TYPES.mirror.feeReduction,
      points: undefined,
      benefits: [
        `${NODE_TYPES.mirror.multiplier}x reward multiplier`,
        `-${NODE_TYPES.mirror.feeReduction}% fee reduction`,
        'Enhanced network support',
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
  ];
}

/**
 * Get all premium features/benefits
 */
export function getAllPremiumFeatures(): RewardItem[] {
  return [
    {
      id: 'premium-early-access',
      type: 'premium' as const,
      name: 'Early Access',
      description: 'Get early access to new dApps and features',
      requirement: 'Tier 3+ KREX or Diamond NFT',
      multiplier: undefined,
      feeReduction: undefined,
      points: undefined,
      benefits: [
        'Access to beta features',
        'Early dApp releases',
        'Priority support',
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
    {
      id: 'premium-analytics',
      type: 'premium' as const,
      name: 'Analytics Dashboard',
      description: 'Access to advanced analytics and insights',
      requirement: 'Tier 4 KREX',
      multiplier: undefined,
      feeReduction: undefined,
      points: undefined,
      benefits: [
        'Detailed reward analytics',
        'Usage statistics',
        'Performance metrics',
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
    {
      id: 'premium-governance',
      type: 'premium' as const,
      name: 'Governance Participation',
      description: 'Participate in ecosystem governance decisions',
      requirement: 'Tier 3+ KREX',
      multiplier: undefined,
      feeReduction: undefined,
      points: undefined,
      benefits: [
        'Vote on proposals',
        'Submit governance proposals',
        'Shape ecosystem direction',
      ],
      isUnlocked: false,
      userStatus: undefined,
    },
  ];
}

/**
 * Get all rewards combined
 */
export function getAllRewards(): RewardItem[] {
  return [
    ...getAllKREXTierRewards(),
    ...getAllNFTRewards(),
    ...getAllNodeRewards(),
    ...getAllPremiumFeatures(),
  ];
}

/**
 * Determine which rewards are unlocked for a user
 */
export function getUserRewardStatus(
  userStatus: UserRewardStatus
): RewardItem[] {
  const allRewards = getAllRewards();
  const { krexTier, krexBalance, nftStatus, hasNode, nodeType } = userStatus;

  const hasAnyNFT = !!(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX ||
    (nftStatus.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v)));
  const hasDiamondNFT = !!(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus.hasRarestNFT;

  return allRewards.map((reward) => {
    let isUnlocked = false;
    let userStatusText: string | undefined;

    switch (reward.type) {
      case 'krex-tier':
        {
          const tierConfig = KREX_TIERS[reward.id.replace('krex-', '') as KREXTier];
          if (tierConfig) {
            isUnlocked = krexBalance >= tierConfig.minKREX;
            if (tierConfig.tier === krexTier) {
              userStatusText = 'Current Tier';
            }
          }
        }
        break;

      case 'nft':
        if (reward.id === 'nft-regular') {
          isUnlocked = hasAnyNFT && !hasDiamondNFT && !hasRarestNFT;
          if (isUnlocked) userStatusText = 'You have this';
        } else if (reward.id === 'nft-diamond') {
          isUnlocked = hasDiamondNFT && !hasRarestNFT;
          if (isUnlocked) userStatusText = 'You have this';
        } else if (reward.id === 'nft-rarest') {
          isUnlocked = !!hasRarestNFT;
          if (isUnlocked) userStatusText = 'You have this';
        }
        break;

      case 'node':
        if (reward.id === 'node-light') {
          isUnlocked = hasNode && nodeType === 'light';
          if (isUnlocked) userStatusText = 'Active';
        } else if (reward.id === 'node-mirror') {
          isUnlocked = hasNode && nodeType === 'mirror';
          if (isUnlocked) userStatusText = 'Active';
        }
        break;

      case 'premium':
        if (reward.id === 'premium-early-access') {
          const tierConfig = KREX_TIERS[krexTier];
          isUnlocked = tierConfig.minKREX >= KREX_TIERS.Tier2.minKREX || hasDiamondNFT || hasRarestNFT;
        } else if (reward.id === 'premium-analytics') {
          const tierConfig = KREX_TIERS[krexTier];
          isUnlocked = tierConfig.minKREX >= KREX_TIERS.Tier3.minKREX;
        } else if (reward.id === 'premium-governance') {
          const tierConfig = KREX_TIERS[krexTier];
          isUnlocked = tierConfig.minKREX >= KREX_TIERS.Tier2.minKREX;
        }
        if (isUnlocked) userStatusText = 'Unlocked';
        break;
    }

    return {
      ...reward,
      isUnlocked,
      userStatus: userStatusText,
    };
  });
}

/**
 * Filter rewards based on criteria
 */
export function filterRewards(
  rewards: RewardItem[],
  filters: {
    types?: ('krex-tier' | 'nft' | 'node' | 'premium')[];
    status?: ('unlocked' | 'locked')[];
    searchQuery?: string;
  }
): RewardItem[] {
  let filtered = [...rewards];

  // Filter by type
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((reward) => filters.types!.includes(reward.type));
  }

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    const showUnlocked = filters.status.includes('unlocked');
    const showLocked = filters.status.includes('locked');
    
    if (showUnlocked && !showLocked) {
      filtered = filtered.filter((reward) => reward.isUnlocked);
    } else if (showLocked && !showUnlocked) {
      filtered = filtered.filter((reward) => !reward.isUnlocked);
    }
    // If both are selected, show all (no filter)
  }

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter((reward) => {
      const searchableText = [
        reward.name,
        reward.description,
        reward.requirement,
        ...reward.benefits,
        reward.userStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  return filtered;
}
