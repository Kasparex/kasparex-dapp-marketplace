'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getL1UtxoEntries } from '@/lib/kaspa/l1WalletActions';
import { sompisToKas } from '@/lib/kaspa/api';
import { getErrorMessage } from '@/lib/utils';

interface UtxoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UtxoViewerModal({ isOpen, onClose }: UtxoViewerModalProps) {
  const { state: kaspaState } = useKaspaWallet();
  const [utxos, setUtxos] = useState<Array<{ amount: number | string; [key: string]: any }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUtxos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!kaspaState.isConnected || !kaspaState.provider) {
        setError('Connect a Kaspa wallet first');
        setUtxos([]);
        return;
      }
      const entries = await getL1UtxoEntries(kaspaState.provider);
      setUtxos(entries || []);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to fetch UTXOs');
      setError(errorMessage);
      console.error('Fetch UTXOs error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [kaspaState.isConnected, kaspaState.provider]);

  useEffect(() => {
    if (isOpen) {
      void fetchUtxos();
    } else {
      setUtxos([]);
      setError(null);
    }
  }, [isOpen, fetchUtxos]);

  const formatAmount = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    
    // If amount is large (likely sompis), convert to KAS
    if (num > 1000000) {
      return `${sompisToKas(num).toFixed(8)} KAS`;
    }
    return `${num.toFixed(8)}`;
  };

  const totalAmount = utxos.reduce((sum, utxo) => {
    const amount = typeof utxo.amount === 'string' ? parseFloat(utxo.amount) : utxo.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                UTXO Entries
              </h2>
              {utxos.length > 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Total: {formatAmount(totalAmount)} • {utxos.length} UTXO{utxos.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUtxos}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                aria-label="Refresh"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          ) : utxos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">No UTXO entries found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {utxos.map((utxo, index) => (
                <div
                  key={index}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        UTXO #{index + 1}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Amount: <span className="font-mono font-semibold">{formatAmount(utxo.amount)}</span>
                      </div>
                      {utxo.outpoint && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono break-all">
                          {typeof utxo.outpoint === 'object' ? JSON.stringify(utxo.outpoint) : String(utxo.outpoint)}
                        </div>
                      )}
                    </div>
                  </div>
                  {Object.keys(utxo).length > 1 && (
                    <details className="mt-2">
                      <summary className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-zinc-100 dark:bg-zinc-900 p-2 rounded overflow-auto">
                        {JSON.stringify(utxo, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

