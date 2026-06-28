'use client';

import { useState } from 'react';
import { getExplorerTxUrlForChain } from '@/lib/dapps/deployer';

export interface TransactionPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  chainId?: number;
  title?: string;
}

export function TransactionPendingModal({
  isOpen,
  onClose,
  txHash,
  chainId = 38833,
  title = 'Transaction submitted',
}: TransactionPendingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const explorerUrl = getExplorerTxUrlForChain(chainId, txHash);
  const shortHash = txHash.startsWith('0x') ? txHash.slice(0, 10) + '...' + txHash.slice(-8) : txHash.slice(0, 8) + '...' + txHash.slice(-6);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 shadow-xl p-6 space-y-4" role="dialog" aria-modal="true">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
        <p className="kx-body">Waiting for confirmation. You can track the transaction below.</p>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-zinc-800 dark:text-zinc-200">{shortHash}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={copyHash} className="p-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Copy hash">
                {copied ? <span className="text-emerald-500 text-xs">Copied</span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              </button>
              {explorerUrl !== '#' && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                  View in Explorer
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600">
          Close
        </button>
      </div>
    </div>
  );
}
