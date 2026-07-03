'use client';

import { createPortal } from 'react-dom';
import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { TokenDetail } from '@/components/tokens/TokenDetail';

interface TokenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  pageConfig?: TokenPageConfig;
}

export function TokenPreviewModal({ isOpen, onClose, token, pageConfig }: TokenPreviewModalProps) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative flex flex-col bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-preview-title"
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 shrink-0">
          <div className="min-w-0">
            <p id="token-preview-title" className="text-base font-black text-zinc-900 dark:text-zinc-100">
              Public token page preview
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tabs and blocks reflect your page builder layout. Side panel is hidden in preview.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 bg-zinc-50 dark:bg-zinc-950">
          <TokenDetail token={token} pageConfig={pageConfig} preview />
        </div>
      </div>
    </div>,
    document.body,
  );
}
