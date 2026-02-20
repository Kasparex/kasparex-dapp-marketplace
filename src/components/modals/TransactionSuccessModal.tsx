'use client';

import { useEffect } from 'react';
import { getExplorerTxUrlForChain } from '@/lib/dapps/deployer';

export interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  chainId?: number;
  gridAmount?: string;
  pointsEarned?: number;
  /** Auto-close after this many ms (default 8000). Set to 0 to disable. */
  autoCloseMs?: number;
}

export function TransactionSuccessModal({
  isOpen,
  onClose,
  txHash,
  chainId = 38836,
  gridAmount,
  pointsEarned,
  autoCloseMs = 8000,
}: TransactionSuccessModalProps) {
  useEffect(() => {
    if (!isOpen || autoCloseMs <= 0) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  const explorerUrl = getExplorerTxUrlForChain(chainId, txHash);
  const shortHash = txHash.slice(0, 10) + '...' + txHash.slice(-8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-zinc-900 shadow-xl p-6 space-y-4"
        role="dialog"
        aria-labelledby="tx-success-title"
        aria-modal="true"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 id="tx-success-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Transaction confirmed
          </h2>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Transaction hash: <span className="font-mono text-zinc-800 dark:text-zinc-200">{shortHash}</span>
        </p>

        {(gridAmount != null && gridAmount !== '') || (pointsEarned != null && pointsEarned > 0) ? (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-1 text-sm">
            {gridAmount != null && gridAmount !== '' && (
              <p className="text-zinc-700 dark:text-zinc-300">
                tGRID / GRID: <span className="font-medium text-green-600 dark:text-green-400">{gridAmount}</span>
              </p>
            )}
            {pointsEarned != null && pointsEarned > 0 && (
              <p className="text-zinc-700 dark:text-zinc-300">
                Points earned: <span className="font-medium text-green-600 dark:text-green-400">{pointsEarned}</span>
              </p>
            )}
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          {explorerUrl !== '#' && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              View in Explorer
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-green-600 dark:bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
