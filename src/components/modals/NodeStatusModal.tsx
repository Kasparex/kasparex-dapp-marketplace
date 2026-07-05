'use client';

import { createPortal } from 'react-dom';

export function NodeStatusModal({
  isOpen,
  onClose,
  title = 'Node status',
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
        <div className="p-5 space-y-3">
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            Node operator detection and reward tracking is coming soon.
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 text-xs text-zinc-600 dark:text-zinc-400">
            This will display node status and received rewards (likely in GRID) for connected node operators, plus a setup guide.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

