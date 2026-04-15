'use client';

import { createPortal } from 'react-dom';

export function BridgeInfoModal({
  isOpen,
  onClose,
  networkName,
  nativeSymbol,
  body,
  primaryAction,
  secondaryAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  networkName: string;
  nativeSymbol: string;
  body?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  const defaultBody =
    body ||
    `On ${networkName}, transaction fees are paid in ${nativeSymbol}. If you don’t have ${nativeSymbol} yet, you’ll need to bridge it in before you can use dApps.`;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Network fees</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {networkName} uses {nativeSymbol}
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
        <div className="p-5 space-y-4">
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{defaultBody}</div>
          <div className="grid grid-cols-2 gap-2">
            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors"
              >
                {secondaryAction.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors"
              >
                Close
              </button>
            )}
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors"
              >
                {primaryAction.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors"
              >
                OK
              </button>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
            Tip: keep a small amount of {nativeSymbol} for gas.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

