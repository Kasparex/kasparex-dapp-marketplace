'use client';

import type { KREXTier, NFTStatus, NodeProviderStatus } from '@/lib/rewards/types';
import { KREX_TIERS } from '@/lib/rewards/types';

interface BadgesDisplayProps {
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  nodeProvider: NodeProviderStatus;
  className?: string;
}

export function BadgesDisplay({
  krexTier,
  nftStatus,
  nodeProvider,
  className = '',
}: BadgesDisplayProps) {
  const tierConfig = KREX_TIERS[krexTier];
  const hasRegularNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = nftStatus.hasRarestNFT;
  const hasAnyBadge = krexTier !== 'Tier0' || hasRegularNFT || hasDiamondNFT || hasRarestNFT || nodeProvider.isNodeProvider;

  if (!hasAnyBadge) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Status, Rarity & Recognition
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        These badges will be displayed on your Kasparex profile and across supported dApps, recognizing your elite status in the ecosystem.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KREX Tier Badges */}
        {krexTier !== 'Tier0' && (
          <div className="p-4 bg-gradient-to-br from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border-2 border-[#02abb8]/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#02abb8]/20 flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {tierConfig.label} Badge
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {tierConfig.description}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {tierConfig.multiplier}x multiplier • {tierConfig.feePercent}% fee
              </div>
            </div>
          </div>
        )}

        {/* Rarest NFT Badge */}
        {hasRarestNFT && (
          <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg border-2 border-yellow-500/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Rarest NFT Badge
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Rarest NFT (any collection)
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                +5x multiplier • 0.0% fee
              </div>
            </div>
          </div>
        )}

        {/* Diamond NFT Badge */}
        {hasDiamondNFT && (
          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border-2 border-purple-500/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Diamond NFT Badge
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Rare Diamond trait holder
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                +3x multiplier • -0.2% fee reduction
              </div>
            </div>
          </div>
        )}

        {/* Regular NFT Badge */}
        {hasRegularNFT && !hasDiamondNFT && !hasRarestNFT && (
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border-2 border-green-500/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  NFT Holder Badge
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  KREXPRIME or PIXELKREX holder
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                +1x multiplier • -0.1% fee reduction
              </div>
            </div>
          </div>
        )}

        {/* Node Provider Badge */}
        {nodeProvider.isNodeProvider && (
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border-2 border-blue-500/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Node Provider Badge
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Krex Node Provider
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {nodeProvider.nodeMultiplier}x multiplier • Fee reduction active
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Badge Preview Note */}
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          💡 These badges will be visible on your profile page and across all supported dApps, allowing the community to recognize elite holders and contributors to the Kasparex ecosystem.
        </p>
      </div>
    </div>
  );
}

