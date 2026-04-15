'use client';

import { createPortal } from 'react-dom';

export function ReceiveAddressModal({
  isOpen,
  onClose,
  title = 'Receive',
  address,
  displayAddress,
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  address: string;
  displayAddress: string;
  onCopy: () => void | Promise<void>;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Copy your address to receive funds.
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
        <div className="p-5 space-y-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Address</div>
          <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
            {displayAddress}
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy address
          </button>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
            Make sure you’re sending to the correct network.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

