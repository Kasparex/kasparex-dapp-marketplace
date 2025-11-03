/**
 * Kaspa Wallet Connection Modal
 * 
 * Modal for selecting and connecting to native Kaspa wallets
 */

'use client';

import { useState, useEffect } from 'react';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider, KaspaWalletProviderInfo } from '@/lib/kaspa/types';

interface KaspaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KaspaWalletModal({ isOpen, onClose }: KaspaWalletModalProps) {
  const { connect, state } = useKaspaWallet();
  const [availableWallets, setAvailableWallets] = useState<KaspaWalletProviderInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect available wallets when modal opens
  useEffect(() => {
    if (isOpen) {
      const wallets = detectKaspaWallets();
      setAvailableWallets(wallets);
      setError(null);
    }
  }, [isOpen]);

  const handleConnect = async (provider: KaspaWalletProvider) => {
    setIsConnecting(true);
    setError(null);

    try {
      await connect(provider);
      // Close modal on successful connection
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Connect Kaspa Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Connect to a native Kaspa wallet to interact with KRC-20 tokens and native Kaspa dApps.
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {availableWallets.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                  No Kaspa wallets detected. Please install a compatible wallet:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>KasWare</li>
                  <li>Kastle</li>
                  <li>Kaspium</li>
                  <li>OKX Wallet</li>
                  <li>SafePal</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={isConnecting || state.isConnected}
                    className="w-full flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {wallet.name.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {wallet.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {wallet.isInstalled ? 'Installed' : 'Not installed'}
                        </div>
                      </div>
                    </div>
                    {isConnecting && state.provider === wallet.id ? (
                      <svg className="animate-spin h-5 w-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

