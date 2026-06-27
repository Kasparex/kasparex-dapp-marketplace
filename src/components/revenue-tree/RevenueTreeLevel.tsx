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
  levelShareIkas?: number;
  currencySymbol?: string;
}

function formatAddress(address: string) {
  if (!address || address === '0x0000000000000000000000000000000000000000') return 'Genesis Wallet';
  if (address.startsWith('kaspa:')) {
    const parts = address.split('...');
    if (parts.length > 1) return address;
    return `${address.slice(0, 10)}...${address.slice(-4)}`;
  }
  if (address.startsWith('0x')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
}

export function RevenueTreeLevel({
  level,
  isCurrentUser = false,
  contentType,
  contentSlug,
  levelShareIkas,
  currencySymbol,
}: RevenueTreeLevelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayAddress = formatAddress(level.walletAddress);
  const showShareIkas = typeof levelShareIkas === 'number' && currencySymbol;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`w-full text-left rounded-xl border p-4 transition-colors hover:border-[#02abb8]/40 ${
          isCurrentUser
            ? 'border-[#02abb8]/40 bg-[#02abb8]/5 dark:bg-[#02abb8]/10'
            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                isCurrentUser ? 'bg-[#02abb8] text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              L{level.level}
            </span>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                level.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
              aria-hidden
            />
            <span className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {displayAddress}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{level.sharePercentage}% share</p>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{level.userCount} users</p>
          </div>
        </div>
        {showShareIkas ? (
          <p className="mt-2 text-sm font-semibold text-[#02abb8] tabular-nums">
            +{levelShareIkas.toFixed(2)} {currencySymbol}
          </p>
        ) : null}
        {isCurrentUser ? (
          <span className="mt-2 inline-flex rounded-lg bg-[#02abb8]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#02abb8]">
            Your slot
          </span>
        ) : null}
      </button>

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
