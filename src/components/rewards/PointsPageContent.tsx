'use client';

import { useAccount } from 'wagmi';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { BadgesDisplay } from './BadgesDisplay';
import { type NFTStatus, type NodeProviderStatus } from '@/lib/rewards/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';

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
  const { totalPoints } = useLoyaltyPoints();
  const mockHoldings = isConnected && address ? getMockWalletHoldings(address) : null;
  const currentXP = totalPoints > 0 ? totalPoints : (mockHoldings?.xp ?? 0);

  // Get real KREX balance and tier
  const { tier: krexTier } = useKREXBalance();
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

  const hasAnyBadge = krexTier !== 'Tier1' || mockNFTStatus.hasKREXPRIME || mockNFTStatus.hasPIXELKREX || 
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
        {/* Current XP Display */}
        <div className="p-6 bg-gradient-to-r from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border border-[#02abb8]/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {isConnected ? 'Your XP Balance' : 'Connect wallet to view XP'}
              </div>
              <div className="text-4xl font-bold text-[#02abb8]">
                {isConnected ? formatLargeNumber(currentXP) : '-'}
              </div>
              {/* Points come from LoyaltyPoints contract when deployed; otherwise mock */}
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
            <div className="p-3 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Connect your wallet and hold KREX tokens, NFTs, or become a node provider to unlock additional badges.
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
                className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {perk.title}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                    Unlocked
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">
                  {perk.description}
                </p>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
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
                className={`p-4 rounded-lg ${
                  isUnlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50'
                    : isNext
                    ? 'bg-sky-50 dark:bg-sky-950/50'
                    : 'bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                }`}
              >
                <div className={`flex items-start gap-3 ${isUnlocked || isNext ? '' : 'mb-2'}`}>
                  {isUnlocked && (
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {isNext && (
                    <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`text-sm font-semibold ${isUnlocked ? 'text-emerald-900 dark:text-emerald-100' : isNext ? 'text-sky-900 dark:text-sky-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {perk.title}
                      </h3>
                      {isUnlocked ? (
                        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                          Unlocked
                        </span>
                      ) : isNext ? (
                        <span className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400 rounded-full">
                          Next
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mb-2 ${isUnlocked ? 'text-emerald-700 dark:text-emerald-300' : isNext ? 'text-sky-700 dark:text-sky-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {perk.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : isNext ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-500 dark:text-zinc-500'}`}>
                        {formatLargeNumber(perk.pointsRequired)} XP
                      </div>
                      {!isUnlocked && isConnected && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {formatLargeNumber(perk.pointsRequired - currentXP)} needed
                        </div>
                      )}
                    </div>
                  </div>
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

