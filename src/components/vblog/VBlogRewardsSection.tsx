'use client';

// Kasparex vBlog Rewards - Unified with Magazines for curated publishing

import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { KREX_TIERS } from '@/lib/rewards/types';
import { TierBadge } from '@/components/rewards/TierBadge';

export function VBlogRewardsSection() {
    const { balance: krexBalance, tier: krexTier } = useKREXBalance();
    const { nftStatus } = useNFTStatus();
    const pricing = useVBlogPricing();

    const currentTier = KREX_TIERS[krexTier];
    const hasDiscount = pricing.tier.hasKREXDiscount || pricing.tier.hasNFTPerks;

    return (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white mb-1">Author Rewards & Discounts</h3>
                    <p className="text-zinc-500 text-xs">Maximize your earnings through KREX and NFT ownership.</p>
                </div>
                <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800">
                {/* Cost Reduction */}
                <div className="p-6 bg-zinc-900">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Publication Discount</h4>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-white">{hasDiscount ? 'Enabled' : '0%'}</span>
                        {hasDiscount && (
                            <span className="text-sm font-bold text-emerald-500">KREX Tier {currentTier.label.split(' ')[1]}</span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        Your on-chain creation fee is reduced based on your KREX tier.
                        {krexBalance === 0 && ' Hold 10M+ KREX to unlock discounts.'}
                    </p>
                </div>

                {/* Magazine Revenue Share */}
                <div className="p-6 bg-zinc-900">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Mag Potential Share</h4>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-white">100% Transparency</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        When linked to a magazine, authors receive a direct share of community-driven revenue. Verified by Kaspa GHOSTDAG on-chain settlement.
                    </p>
                </div>
            </div>

            {nftStatus && (nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX) && (
                <div className="p-4 bg-orange-500/5 border-t border-zinc-800 text-center">
                    <span className="text-xs font-bold text-orange-400">
                        NFT Multiplier Active: You qualify for premium text limits and enhanced on-chain visibility.
                    </span>
                </div>
            )}
        </div>
    );
}
