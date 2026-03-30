'use client';

import { useRef } from 'react';

export function CompoundUtxosHelpModal({
  isOpen,
  onClose,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}) {
  const copiedRef = useRef(false);
  if (!isOpen) return null;

  const canCopy = typeof window !== 'undefined' && !!navigator?.clipboard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Compound UTXOs (KasWare)</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Fixes “Storage mass exceeds maximum” by consolidating many small UTXOs into fewer larger ones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Your address</p>
            <p className="mt-2 font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">{address || '—'}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="k-control-btn"
                disabled={!address || !canCopy}
                onClick={() => {
                  if (!address) return;
                  void navigator.clipboard.writeText(address);
                  copiedRef.current = true;
                }}
              >
                Copy address
              </button>
            </div>
          </div>

          <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal pl-5">
            <li>Open KasWare → Send.</li>
            <li>Paste your own address as the recipient (send-to-self).</li>
            <li>Send a single amount that covers your usual activity (e.g. 10–50 KAS).</li>
            <li>After it confirms, try the slot action again.</li>
          </ol>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We can’t compound UTXOs automatically from the app (wallets don’t expose a safe “consolidate” API), but this send-to-self is the standard fix.
          </p>
        </div>
      </div>
    </div>
  );
}

