'use client';

import { createPortal } from 'react-dom';
import { KREX_TIERS } from '@/lib/rewards/types';

export function TiersBenefitsModal({
  isOpen,
  onClose,
  title = 'Tiers & benefits',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  const tiers = Object.entries(KREX_TIERS);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
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

        <div className="p-5 space-y-4">
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            Your tier is based on your KREX holdings. Higher tiers unlock bigger multipliers and fee reductions.
          </div>

          <div className="space-y-2">
            {tiers.map(([tierId, cfg]) => (
              <div
                key={tierId}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{cfg.label}</div>
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[#02abb8]/10 text-[#02abb8] dark:text-[#66dfe8] font-black uppercase tracking-widest">
                    {cfg.multiplier}x
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{cfg.description}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  Fee reduction: -{cfg.feeReduction}%{cfg.feeReduction === 0 ? '' : ''} · Reward multiplier: {cfg.multiplier}x
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">NFT perks</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Holding KREXPRIME / PIXELKREX (and special variants) can add extra multipliers and fee reductions.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

