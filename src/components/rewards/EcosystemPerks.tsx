'use client';

import type { KREXTier, NFTStatus, NodeProviderStatus } from '@/lib/rewards/types';
import { KREX_TIERS } from '@/lib/rewards/types';

interface EcosystemPerksProps {
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  nodeProvider: NodeProviderStatus;
  className?: string;
}

export function EcosystemPerks({
  krexTier,
  nftStatus,
  nodeProvider,
  className = '',
}: EcosystemPerksProps) {
  const tierConfig = KREX_TIERS[krexTier];
  const hasRegularNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = nftStatus.hasRarestNFT;
  
  // Calculate total NFT count (simplified - just checking if they have any)
  const nftCount = (hasRegularNFT ? 1 : 0) + (hasDiamondNFT ? 1 : 0) + (hasRarestNFT ? 1 : 0);
  const has5PlusNFTs = nftCount >= 5; // For simulation, we'll show this if they have multiple types

  const perks: Array<{
    title: string;
    description: string;
    unlocked: boolean;
    icon: string;
    color: string;
  }> = [];

  // Tier-based perks
  if (krexTier === 'Tier3') {
    perks.push({
      title: 'Premium dApp Access',
      description: 'Unlock access to exclusive premium dApps',
      unlocked: true,
      icon: '🚀',
      color: 'text-[#02abb8]',
    });
  }
  if (krexTier === 'Tier2' || krexTier === 'Tier3') {
    perks.push({
      title: 'Special Airdrops',
      description: 'Eligible for exclusive token airdrops',
      unlocked: true,
      icon: '🎁',
      color: 'text-[#02abb8]',
    });
  }
  if (krexTier !== 'Tier0') {
    perks.push({
      title: 'Alpha News Access',
      description: 'Early access to ecosystem updates and news',
      unlocked: true,
      icon: '📰',
      color: 'text-[#02abb8]',
    });
  }

  // NFT-based perks
  if (hasRarestNFT) {
    perks.push({
      title: 'VIP Support',
      description: 'Priority customer support and dedicated channel',
      unlocked: true,
      icon: '👑',
      color: 'text-yellow-600 dark:text-yellow-400',
    });
    perks.push({
      title: 'Governance Voting Power',
      description: 'Enhanced voting power in ecosystem governance',
      unlocked: true,
      icon: '🗳️',
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }
  if (hasDiamondNFT) {
    perks.push({
      title: 'Exclusive Events',
      description: 'Access to private events and meetups',
      unlocked: true,
      icon: '🎪',
      color: 'text-purple-600 dark:text-purple-400',
    });
  }
  if (has5PlusNFTs || hasRegularNFT) {
    perks.push({
      title: 'NFT Holder Benefits',
      description: 'Special discounts and early access to NFT drops',
      unlocked: true,
      icon: '✨',
      color: 'text-green-600 dark:text-green-400',
    });
  }

  // Node provider perks
  if (nodeProvider.isNodeProvider) {
    perks.push({
      title: 'Node Operator Rewards',
      description: 'Additional rewards for securing the network',
      unlocked: true,
      icon: '🛡️',
      color: 'text-blue-600 dark:text-blue-400',
    });
    perks.push({
      title: 'Technical Support',
      description: 'Priority technical assistance for node operations',
      unlocked: true,
      icon: '🔧',
      color: 'text-blue-600 dark:text-blue-400',
    });
  }

  // Locked perks (for lower tiers)
  if (krexTier === 'Tier0') {
    perks.push({
      title: 'Premium dApp Access',
      description: 'Unlock at Tier 3',
      unlocked: false,
      icon: '🚀',
      color: 'text-zinc-400',
    });
  }
  if (krexTier === 'Tier0' || krexTier === 'Tier1') {
    perks.push({
      title: 'Special Airdrops',
      description: 'Unlock at Tier 2',
      unlocked: false,
      icon: '🎁',
      color: 'text-zinc-400',
    });
  }
  if (!hasRegularNFT && !hasDiamondNFT && !hasRarestNFT) {
    perks.push({
      title: 'NFT Holder Benefits',
      description: 'Unlock by holding NFTs',
      unlocked: false,
      icon: '✨',
      color: 'text-zinc-400',
    });
  }

  if (perks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Ecosystem Perks & Benefits
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Unlock exclusive benefits based on your holdings and status in the Kasparex ecosystem.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {perks.map((perk, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-2 ${
              perk.unlocked
                ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{perk.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-semibold ${perk.unlocked ? perk.color : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {perk.title}
                  </h4>
                  {perk.unlocked && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {perk.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          💡 These perks will be automatically applied to your Kasparex profile and recognized across all supported dApps. Higher tiers and rare NFT holders unlock additional exclusive benefits.
        </p>
      </div>
    </div>
  );
}

