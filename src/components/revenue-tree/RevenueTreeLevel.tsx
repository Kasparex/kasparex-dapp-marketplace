'use client';

import { useState } from 'react';
import { RevenueTreeLevel as RevenueTreeLevelType } from '@/lib/revenue-tree/types';
import { RevenueTreeLevelModal } from './RevenueTreeLevelModal';
import { RevenueTreeContentType } from '@/lib/revenue-tree/types';

interface RevenueTreeLevelProps {
  level: RevenueTreeLevelType;
  isCurrentUser?: boolean;
  contentType: RevenueTreeContentType;
  contentSlug: string;
  /** iKAS/KAS amount for this level (from amountSpent × treeBps × sharePercentage). Shown in capsule when provided. */
  levelShareIkas?: number;
  /** Currency symbol (e.g. iKAS, KAS). */
  currencySymbol?: string;
}

/**
 * Visual representation of dot indicators (network/tree structure)
 */
function DotIndicators({ count }: { count: number }) {
  const maxDots = 8;
  const displayCount = Math.min(count, maxDots);
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 opacity-60"
        />
      ))}
    </div>
  );
}

export function RevenueTreeLevel({ level, isCurrentUser = false, contentType, contentSlug, levelShareIkas, currencySymbol }: RevenueTreeLevelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return 'Structural Node';
    if (address.startsWith('kaspa:')) {
      const parts = address.split('...');
      if (parts.length > 1) return address;
      return `${address.slice(0, 10)}...${address.slice(-4)}`;
    }
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const displayAddress = formatAddress(level.walletAddress);
  const showShareIkas = typeof levelShareIkas === 'number' && currencySymbol;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
          isCurrentUser
            ? 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-[10px] shadow-inner ${
                    isCurrentUser ? 'bg-purple-600 text-white' : 'bg-[#02abb8] text-white'
                }`}>
                    L{level.level}
                </div>
                <div 
                    className={`w-2.5 h-2.5 rounded-full ring-4 ${
                        level.isActive 
                            ? 'bg-emerald-500 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                            : 'bg-zinc-300 dark:bg-zinc-700 ring-zinc-100 dark:ring-zinc-800'
                    }`}
                />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{level.sharePercentage}% SHARE</span>
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{level.userCount} USERS</span>
            </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-1">
            <span className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400 truncate">
                {displayAddress}
            </span>
            {showShareIkas && (
                <div className="px-3 py-1 bg-[#02abb8]/10 rounded-full border border-[#02abb8]/20">
                    <span className="text-sm font-black text-[#02abb8] tabular-nums">+{levelShareIkas.toFixed(2)} {currencySymbol}</span>
                </div>
            )}
        </div>

        {isCurrentUser && (
            <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                Your Slot
            </div>
        )}
      </div>

      <RevenueTreeLevelModal
        level={level}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isCurrentUser={isCurrentUser}
        contentType={contentType}
        contentSlug={contentSlug}
      />
    </>
  );
}
