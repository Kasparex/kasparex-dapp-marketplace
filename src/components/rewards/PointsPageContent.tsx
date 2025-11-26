'use client';

import { useAccount } from 'wagmi';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import Link from 'next/link';

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

export function PointsPageContent() {
  const { address, isConnected } = useAccount();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;
  const currentXP = holdings?.xp || 0;

  const getUnlockedPerks = () => {
    return XP_PERKS.filter(perk => currentXP >= perk.pointsRequired);
  };

  const getNextPerk = () => {
    const sortedPerks = [...XP_PERKS].sort((a, b) => a.pointsRequired - b.pointsRequired);
    return sortedPerks.find(perk => currentXP < perk.pointsRequired);
  };

  const unlockedPerks = getUnlockedPerks();
  const nextPerk = getNextPerk();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              XP Points & Perks
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

      {/* Unlocked Perks */}
      {unlockedPerks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
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
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          All Available Perks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {XP_PERKS.map((perk, index) => {
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

