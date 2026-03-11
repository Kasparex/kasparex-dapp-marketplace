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
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Activation Progress
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums">
                    {volume.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{currencySymbol}</span>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${isActivated ? 'bg-emerald-500' : 'bg-[#02abb8]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                 Threshold: {req} {currencySymbol}
              </p>
              <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isActivated ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      {isActivated ? 'Active' : 'Genesis'}
                  </span>
              </div>
          </div>
        </div>
    );
}
