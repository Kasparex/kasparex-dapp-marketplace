'use client';

import { useEffect } from 'react';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';

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

  // Auto-close when network becomes compatible
  useEffect(() => {
    if (isOpen && compatibility.isCompatible) {
      onClose();
    }
  }, [isOpen, compatibility.isCompatible, onClose]);

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

  // EVM-compatible dApp but wrong network
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
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

          <div className="mb-6">
            <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{dapp.name}</span> is not compatible with your current network.
            </p>

            {!isConnected ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-base text-yellow-800 dark:text-yellow-300">
                  Please connect your wallet first.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-4">
                  <div className="text-base">
                    <div className="mb-3">
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

                <p className="text-base text-zinc-500 dark:text-zinc-400 mb-4">
                  Please switch to one of the required networks to use this dApp.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-base"
            >
              Dismiss
            </button>
            {isConnected && (
              <button
                onClick={handleSwitchNetwork}
                className="flex-1 px-5 py-3 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-base"
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

