'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KREX_TIERS } from '@/lib/rewards/types';
import Link from 'next/link';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

export default function StudioPortfolioPage() {
    const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
    const { state: kaspaState } = useKaspaWallet();
    const isL1Connected = kaspaState.isConnected;

    // Core Balances
    const { balance: krexBalance, l1Balance: krexL1, l2Balance: krexL2, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
    const { balanceInKas: kasBalance, isLoading: isKasLoading } = useKaspaBalance();
    const gridToken = useGRIDToken(CONTRACT_ADDRESSES.kasplexL2Testnet.GRIDToken);

    // Rewards Status
    const { nftStatus, nftPoints, isLoading: isNFTLoading } = useNFTStatus();
    const { totalPoints: xpPoints } = useLoyaltyPoints();

    // Multiplier Calculation (Simplified for Portfolio view)
    const krexMultiplier = KREX_TIERS[krexTier].multiplier;
    const nftMultiplierAdd = nftStatus?.hasRarestNFT ? 5 : nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ? 3 : (nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX) ? 1 : 0;
    const totalMultiplier = krexMultiplier + nftMultiplierAdd;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-cyan-50/30 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 mb-8">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-bold rounded-full uppercase tracking-widest border border-cyan-500/20">
                                    Unified Assets
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">
                                My Portfolio
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl">
                                Complete overview of your digital assets and ecosystem status across Kaspa L1 and L2 networks.
                            </p>
                        </div>

                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 p-6 flex flex-col items-center justify-center min-w-[200px]">
                            <span className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">Total Multiplier</span>
                            <div className="text-4xl font-black text-cyan-600 dark:text-cyan-400 tracking-tighter">
                                {totalMultiplier}x
                            </div>
                            <div className="mt-2 text-[10px] text-zinc-500 font-medium">
                                {krexMultiplier}x Base + {nftMultiplierAdd}x NFT Bonus
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Assets Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BalanceCard
                    symbol="KAS"
                    name="Kaspa Native"
                    balance={kasBalance || 0}
                    isLoading={isKasLoading}
                    color="cyan"
                    tokenId="kas"
                    isConnected={isL1Connected}
                />
                <BalanceCard
                    symbol="KREX"
                    name="Ecosystem Token"
                    balance={krexBalance}
                    isLoading={isKREXLoading}
                    color="emerald"
                    tokenId="krex"
                    isConnected={isL1Connected || isEVMConnected}
                    extra={`L1: ${formatLargeNumber(krexL1)} | L2: ${formatLargeNumber(krexL2)}`}
                />
                <BalanceCard
                    symbol="GRID"
                    name="Ecosystem Reward"
                    balance={Number(gridToken.formattedBalance.replace(/,/g, ''))}
                    isLoading={gridToken.isLoading}
                    color="indigo"
                    tokenId="grid"
                    isConnected={isEVMConnected}
                />
            </section>

            {/* Rewards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rewards Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                        Rewards Status
                    </h2>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
                        <RewardItem
                            label="KREX Tier"
                            value={KREX_TIERS[krexTier].label}
                            icon={<TierBadge tier={krexTier} isUnlocked={true} />}
                        />
                        <RewardItem
                            label="XP Points"
                            value={formatLargeNumber(xpPoints)}
                            icon="✨"
                        />
                        <RewardItem
                            label="NFT Points"
                            value={nftPoints.toString()}
                            icon="🖼️"
                        />
                        <RewardItem
                            label="active Boosts"
                            value={`${nftMultiplierAdd}x active`}
                            icon="🚀"
                        />

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Link href="/rewards" className="flex items-center justify-center w-full px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                                Marketplace Rewards Hub
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BalanceCard({ symbol, name, balance, isLoading, color, tokenId, isConnected, extra }: {
    symbol: string,
    name: string,
    balance: number,
    isLoading: boolean,
    color: 'cyan' | 'emerald' | 'indigo',
    tokenId: 'kas' | 'krex' | 'grid',
    isConnected: boolean,
    extra?: string
}) {
    const colorClasses = {
        cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-500 shadow-cyan-500/5',
        emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-500 shadow-emerald-500/5',
        indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-500 shadow-indigo-500/5',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} bg-white dark:bg-zinc-900 rounded-2xl border p-6 dark:shadow-none hover:translate-y-[-4px] transition-all duration-300 group`}>
            <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                    <TokenLogoImage tokenId={tokenId} size={24} />
                </div>
                {!isConnected ? (
                    <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase border border-red-500/10">Disconnected</span>
                ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-bold uppercase border border-green-500/10">Live</span>
                )}
            </div>

            <div className="space-y-1">
                <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">{name}</div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
                        {isLoading ? (
                            <div className="w-24 h-8 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
                        ) : (
                            isConnected ? formatLargeNumber(balance) : '0'
                        )}
                    </div>
                    <div className="text-sm font-bold text-zinc-500 uppercase">{symbol}</div>
                </div>
                {extra && <div className="text-[10px] text-zinc-400 font-medium pt-2">{extra}</div>}
            </div>
        </div>
    );
}

function RewardItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 flex items-center justify-center border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                    {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
                </div>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</span>
        </div>
    );
}
