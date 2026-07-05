'use client';

import { createPortal } from 'react-dom';
import { TierRewardsTable } from '@/components/rewards/TierRewardsTable';
import type { KREXTier } from '@/lib/rewards/types';

export function RewardsModal({
  isOpen,
  onClose,
  currentTier,
  krexBalance,
  title = 'Rewards',
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTier: KREXTier;
  krexBalance: number;
  title?: string;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="kx-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tier table, multipliers, and fee reductions.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <TierRewardsTable currentTier={currentTier} krexBalance={krexBalance} />
        </div>
      </div>
    </div>,
    document.body
  );
}

