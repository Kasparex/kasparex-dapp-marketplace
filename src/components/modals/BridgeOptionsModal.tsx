'use client';

import { createPortal } from 'react-dom';
import { BRIDGE_URLS } from '@/lib/walletUi';

export function BridgeOptionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  const open = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return createPortal(
    <div className="kx-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bridge</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Choose what you want to bridge from L1.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={() => open(BRIDGE_URLS.katBridge)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors text-left"
            title="Bridge KRC-20 tokens like KREX"
          >
            <div className="text-sm">Bridge KREX (KRC-20)</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Open KAT Bridge</div>
          </button>

          <button
            type="button"
            onClick={() => open(BRIDGE_URLS.kasplexKasBridge)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors text-left"
            title="Bridge KAS ↔ wKAS (Kasplex)"
          >
            <div className="text-sm">Bridge KAS ↔ wKAS</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Open Kaspa Bridge (Kasplex)</div>
          </button>

          <button
            type="button"
            onClick={() => open(BRIDGE_URLS.igraIkasBridge)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors text-left"
            title="Bridge KAS ↔ iKAS (IGRA)"
          >
            <div className="text-sm">Bridge KAS ↔ iKAS</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Open iKAS Bridge (IGRA)</div>
          </button>

          <button
            type="button"
            onClick={() => open(BRIDGE_URLS.nftBridge)}
            className="w-full px-4 py-3 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors text-left"
            title="Bridge NFTs from L1 to L2"
          >
            <div className="text-sm">Bridge NFTs</div>
            <div className="text-xs text-white/80 mt-0.5">Open NFT Bridge</div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

