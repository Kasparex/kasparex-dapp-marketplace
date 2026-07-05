'use client';

import { createPortal } from 'react-dom';
import { BRIDGE_URLS } from '@/lib/walletUi';

export function HelpModal({
  isOpen,
  onClose,
  title = 'Help',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="kx-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
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
            Quick help for bridging, buying, and using Kasparex.
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 space-y-2">
            <div className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">FAQ</div>
            <div className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">Why do I need gas on L2?</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              L2 transactions require the native token (wKAS on Kasplex, iKAS on IGRA) to pay fees.
            </div>
            <div className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold pt-2">How do I get KREX on L2?</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              You can buy directly on L2 via DEXs, or bridge KREX from L1 using KAT Bridge.
            </div>
            <div className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold pt-2">How do I bridge NFTs?</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Buy NFTs on L1 (KaspaCom) and bridge them to L2 via the NFT bridge.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={BRIDGE_URLS.katBridge}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors text-center"
            >
              KAT Bridge
            </a>
            <a
              href={BRIDGE_URLS.nftBridge}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors text-center"
            >
              NFT Bridge
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

