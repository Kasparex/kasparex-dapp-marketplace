'use client';

import { useAccount } from 'wagmi';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import Link from 'next/link';
import { BadgesDisplay } from './BadgesDisplay';
import { KREX_TIERS, type KREXTier, type NFTStatus, type NodeProviderStatus } from '@/lib/rewards/types';

// Mock helper functions (same as in KREXStatusBox)
function getMockKREXBalance(address: string | undefined): number {
  if (!address) return 0;
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tierOptions = [0, 5_000_000, 25_000_000, 75_000_000, 150_000_000];
  return tierOptions[hash % tierOptions.length];
}

function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance >= 100_000_000) return 'Tier3';
  if (balance >= 50_000_000) return 'Tier2';
  if (balance >= 10_000_000) return 'Tier1';
  return 'Tier0';
}

interface PointsPageContentProps {
  filters: {
    unlockedPerks: boolean;
    lockedPerks: boolean;
    unlockedBadges: boolean;
    lockedBadges: boolean;
    nftPerks: boolean;
    nodePerks: boolean;
  };
}

interface Perk {
  title: string;
  description: string;
  pointsRequired: number;
  icon?: string;
  category: 'tier' | 'feature' | 'benefit';
}

const XP_PERKS: Perk[] = [
  {
    title: 'Tier 0',
    description: 'Basic tier with standard rewards',
    pointsRequired: 0,
    category: 'tier',
  },
  {
    title: 'Tier 1',
    description: 'Enhanced rewards and multipliers',
    pointsRequired: 10_000,
    category: 'tier',
  },
  {
    title: 'Tier 2',
    description: 'Premium benefits and fee reductions',
    pointsRequired: 50_000,
    category: 'tier',
  },
  {
    title: 'Tier 3',
    description: 'Maximum rewards and exclusive perks',
    pointsRequired: 100_000,
    category: 'tier',
  },
  {
    title: 'Early Access',
    description: 'Access to new dApps before public release',
    pointsRequired: 25_000,
    category: 'feature',
  },
  {
    title: 'Priority Support',
    description: 'Faster response times for support requests',
    pointsRequired: 15_000,
    category: 'feature',
  },
  {
    title: 'Exclusive Events',
    description: 'Invitations to special events and airdrops',
    pointsRequired: 30_000,
    category: 'benefit',
  },
  {
    title: 'Governance Voting',
    description: 'Vote on ecosystem proposals and changes',
    pointsRequired: 40_000,
    category: 'benefit',
  },
  {
    title: 'NFT Whitelist',
    description: 'Priority access to NFT drops and collections',
    pointsRequired: 60_000,
    category: 'benefit',
  },
  {
    title: 'Zero Fee Mode',
    description: 'Complete fee exemption for all transactions',
    pointsRequired: 200_000,
    category: 'benefit',
  },
];

export function PointsPageContent({ filters }: PointsPageContentProps) {
  const { address, isConnected } = useAccount();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;
  const currentXP = holdings?.xp || 0;

  // Mock badge status (for simulation)
  const mockKREXBalance = getMockKREXBalance(address);
  const krexTier = getKREXTierFromBalance(mockKREXBalance);
  const mockNFTStatus: NFTStatus = {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
  };
  const mockNodeProvider: NodeProviderStatus = {
    isNodeProvider: false,
    nodeMultiplier: 5,
    nodeFeeReduction: 0.1,
  };

  const hasAnyBadge = krexTier !== 'Tier0' || mockNFTStatus.hasKREXPRIME || mockNFTStatus.hasPIXELKREX || 
    mockNFTStatus.hasDiamondKREXPRIME || mockNFTStatus.hasDiamondPIXELKREX || 
    mockNFTStatus.hasRarestNFT || mockNodeProvider.isNodeProvider;

  const getUnlockedPerks = () => {
    return XP_PERKS.filter(perk => currentXP >= perk.pointsRequired);
  };

  const getNextPerk = () => {
    const sortedPerks = [...XP_PERKS].sort((a, b) => a.pointsRequired - b.pointsRequired);
    return sortedPerks.find(perk => currentXP < perk.pointsRequired);
  };

  const unlockedPerks = getUnlockedPerks();
  const nextPerk = getNextPerk();

  // Filter perks based on filters
  const filteredPerks = XP_PERKS.filter(perk => {
    const isUnlocked = currentXP >= perk.pointsRequired;
    if (isUnlocked && !filters.unlockedPerks) return false;
    if (!isUnlocked && !filters.lockedPerks) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              XP Points, Perks & Badges
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Earn points through dApp usage and unlock exclusive benefits
            </p>
          </div>
          <Link
            href="/rewards-calculator"
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Rewards Calculator
          </Link>
        </div>

        {/* Current XP Display */}
        <div className="p-6 bg-gradient-to-r from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border border-[#02abb8]/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {isConnected ? 'Your XP Balance' : 'Connect wallet to view XP'}
              </div>
              <div className="text-4xl font-bold text-[#02abb8]">
                {isConnected ? formatLargeNumber(currentXP) : '—'}
              </div>
            </div>
            {nextPerk && (
              <div className="text-right">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Next Perk
                </div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {nextPerk.title}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatLargeNumber(nextPerk.pointsRequired - currentXP)} XP needed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {(filters.unlockedBadges || filters.lockedBadges) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Status, Rarity & Recognition
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            These badges will be displayed on your Kasparex profile and across supported dApps, recognizing your elite status in the ecosystem.
          </p>
          {hasAnyBadge && filters.unlockedBadges && (
            <div className="mb-6">
              <BadgesDisplay
                krexTier={krexTier}
                nftStatus={mockNFTStatus}
                nodeProvider={mockNodeProvider}
              />
            </div>
          )}
          {filters.lockedBadges && (
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                💡 Connect your wallet and hold KREX tokens, NFTs, or become a node provider to unlock additional badges.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Unlocked Perks */}
      {unlockedPerks.length > 0 && filters.unlockedPerks && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Unlocked Perks ({unlockedPerks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedPerks.map((perk, index) => (
              <div
                key={index}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500/40"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {perk.title}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">
                    ✓ Unlocked
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  {perk.description}
                </p>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  {formatLargeNumber(perk.pointsRequired)} XP required
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Perks */}
      {(filters.unlockedPerks || filters.lockedPerks) && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            All Available Perks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPerks.map((perk, index) => {
            const isUnlocked = currentXP >= perk.pointsRequired;
            const isNext = nextPerk?.title === perk.title;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  isUnlocked
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500/40'
                    : isNext
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500/40'
                    : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {perk.title}
                  </h3>
                  {isUnlocked ? (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">
                      ✓ Unlocked
                    </span>
                  ) : isNext ? (
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full">
                      Next
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  {perk.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {formatLargeNumber(perk.pointsRequired)} XP
                  </div>
                  {!isUnlocked && isConnected && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {formatLargeNumber(perk.pointsRequired - currentXP)} needed
                    </div>
                  )}
                </div>
                {!isUnlocked && (
                  <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-[#02abb8] h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (currentXP / perk.pointsRequired) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* How to Earn */}
      <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          How to Earn XP Points
        </h2>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>• Earn 100 XP for every 1 KAS spent in dApps</p>
          <p>• Points are multiplied by your KREX tier and NFT ownership</p>
          <p>• Higher tiers provide better point multipliers</p>
          <p>• Use dApps regularly to accumulate points and unlock perks</p>
        </div>
      </div>
    </div>
  );
}

