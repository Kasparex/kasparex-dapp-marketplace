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
    if (address.startsWith('kaspa:')) {
      const parts = address.split('...');
      if (parts.length > 1) {
        return address; // Already formatted
      }
      return `${address.slice(0, 10)}...${address.slice(-4)}`;
    }
    // EVM address format
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
        className={`flex flex-col gap-1 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:border-[#02abb8]/30 ${
          isCurrentUser
            ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30 dark:border-purple-500/50'
            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
        }`}
      >
        {/* Line 1: LEVEL XX — X% Share only */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className={`flex-shrink-0 text-xs font-black uppercase tracking-widest ${
            isCurrentUser ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400'
          }`}>
            LEVEL {String(level.level).padStart(2, '0')}
          </div>
          <div className="text-xs font-black text-green-600 dark:text-green-400">
            {level.sharePercentage}% <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase ml-1">Share</span>
          </div>
        </div>
        {/* Line 2: address — Users: N — Y.XX iKAS (single row, no duplication) */}
        <div className="flex items-center justify-between gap-2 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 pt-1.5 mt-0.5">
          <span className="truncate flex-1 min-w-0" title={level.walletAddress}>
            <span className={isCurrentUser ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}>{displayAddress}</span>
          </span>
          <span className="flex-shrink-0 text-xs text-zinc-600 dark:text-zinc-400">Users: <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{level.userCount}</span></span>
          {showShareIkas ? (
            <span className="flex-shrink-0 text-sm font-semibold text-[#02abb8] tabular-nums">{levelShareIkas.toFixed(2)} {currencySymbol}</span>
          ) : (
            <div className="flex-shrink-0"><DotIndicators count={level.userCount || 1} /></div>
          )}
        </div>
      </div>

      {/* Modal */}
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
