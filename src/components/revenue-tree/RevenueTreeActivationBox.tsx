'use client';

import { useRevenueTree } from '@/hooks/useRevenueTree';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { formatEther } from 'viem';

export interface RevenueTreeActivationBoxProps {
    address?: string;
}

export function RevenueTreeActivationBox({ address: propAddress }: RevenueTreeActivationBoxProps) {
    const { address: connectedAddress } = useAccount();
    const address = propAddress || connectedAddress;
     const { tree, lifetimeVolume, activationThreshold, isSupported, isLoading } = useRevenueTree(
        propAddress ? { address: propAddress as `0x${string}` } : {}
    );
    const chainId = useChainId();
    const currencySymbol = getNativeCurrencySymbol(chainId);

    if (!address) return null;
    
    // Default to last known or 0 state during loading to prevent flashing
    const isActivated = !!tree?.activatedAt;
    const volume = lifetimeVolume ? parseFloat(formatEther(lifetimeVolume)) : 0;
    const req = activationThreshold ? parseFloat(formatEther(activationThreshold)) : 100;
    const progress = req > 0 ? Math.min((volume / req) * 100, 100) : 100;

    if (isActivated) {
        return (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                            Tree Automatically Activated
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Activation Progress
            </span>
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {volume.toFixed(2)} / {req} {currencySymbol}
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#02abb8] to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1.5">
             <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             Spend {req} {currencySymbol} lifetime inside dApps to activate your global Revenue Tree and begin earning from others!
          </p>
        </div>
    );
}
