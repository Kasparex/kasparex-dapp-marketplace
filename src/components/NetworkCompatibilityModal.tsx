'use client';

import { useState, useEffect } from 'react';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { KRC20_NETWORK_INFO } from '@/lib/wagmi';

interface NetworkCompatibilityModalProps {
  dapp: DApp;
  isOpen: boolean;
  onClose: () => void;
  onDismiss?: () => void;
}

export function NetworkCompatibilityModal({
  dapp,
  isOpen,
  onClose,
  onDismiss,
}: NetworkCompatibilityModalProps) {
  const { openChainModal } = useChainModal();
  const { isConnected } = useAccount();
  const compatibility = useNetworkCompatibility(dapp);
  const [showKRC20Info, setShowKRC20Info] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowKRC20Info(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSwitchNetwork = () => {
    openChainModal?.();
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    onClose();
  };

  // KRC-20 only dApp - special handling
  if (compatibility.isKRC20Only) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                KRC-20 Network Required
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
              <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{dapp.name}</span> requires the{' '}
                <span className="font-semibold">KRC-20 L1 Mainnet</span> network, which is not EVM-compatible.
              </p>

              {!showKRC20Info ? (
                <button
                  onClick={() => setShowKRC20Info(true)}
                  className="text-sm text-[#02abb8] hover:underline mb-3"
                >
                  Learn more about KRC-20 →
                </button>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <p className="mb-2">
                    KRC-20 tokens run on Kaspa Layer 1 and require Kaspa-native wallets (not EVM wallets like MetaMask).
                  </p>
                  <p className="mb-3">
                    You'll need to use a compatible Kaspa wallet to interact with this dApp.
                  </p>
                  <div className="space-y-1 text-xs">
                    <a
                      href={KRC20_NETWORK_INFO.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline block"
                    >
                      📚 Documentation
                    </a>
                    <a
                      href={KRC20_NETWORK_INFO.indexer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline block"
                    >
                      🔍 KRC-20 Indexer
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Close
              </button>
              {dapp.url && (
                <a
                  href={dapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-center"
                >
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EVM-compatible dApp but wrong network
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Network Mismatch
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
            <p className="text-zinc-600 dark:text-zinc-400 mb-3">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{dapp.name}</span> is not compatible with your current network.
            </p>

            {!isConnected ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Please connect your wallet first.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-3">
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-zinc-500 dark:text-zinc-400">Current Network:</span>{' '}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {compatibility.currentChainName || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Required Network:</span>{' '}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {compatibility.requiredChainNames.length > 0
                          ? compatibility.requiredChainNames.join(' or ')
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  Please switch to one of the required networks to use this dApp.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              Dismiss
            </button>
            {isConnected && (
              <button
                onClick={handleSwitchNetwork}
                className="flex-1 px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium"
              >
                Switch Network
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

