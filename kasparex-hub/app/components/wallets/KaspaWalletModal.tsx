/**
 * Kaspa Wallet Modal
 * 
 * RainbowKit-style modal for selecting Kaspa wallet (Kasware or Kastle)
 */

import { useState } from "react";
import { isKaswareInstalled } from "~/lib/kaspa/kasware";
import { isKastleInstalled } from "~/lib/kaspa/kastle";
import { useKaspaWallet } from "~/lib/kaspa/provider";

interface KaspaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KaspaWalletModal({ isOpen, onClose }: KaspaWalletModalProps) {
  const { connect, isLoading } = useKaspaWallet();
  const [connecting, setConnecting] = useState<'kasware' | 'kastle' | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (walletType: 'kasware' | 'kastle') => {
    setConnecting(walletType);
    try {
      await connect(walletType);
      onClose();
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      // Error is handled by the provider
    } finally {
      setConnecting(null);
    }
  };

  const kaswareInstalled = isKaswareInstalled();
  const kastleInstalled = isKastleInstalled();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Connect Kaspa Wallet
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            {/* Kasware */}
            <button
              onClick={() => handleConnect('kasware')}
              disabled={!kaswareInstalled || isLoading || connecting !== null}
              className="w-full p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 hover:border-[#02abb8] dark:hover:border-[#02abb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 bg-white dark:bg-zinc-900"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">KW</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">Kasware</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {kaswareInstalled ? 'Connect to Kasware wallet' : 'Install Kasware extension'}
                </div>
              </div>
              {connecting === 'kasware' && (
                <svg className="animate-spin h-5 w-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>

            {/* Kastle */}
            <button
              onClick={() => handleConnect('kastle')}
              disabled={!kastleInstalled || isLoading || connecting !== null}
              className="w-full p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 hover:border-[#02abb8] dark:hover:border-[#02abb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 bg-white dark:bg-zinc-900"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">KL</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">Kastle</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {kastleInstalled ? 'Connect to Kastle wallet' : 'Install Kastle extension'}
                </div>
              </div>
              {connecting === 'kastle' && (
                <svg className="animate-spin h-5 w-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              New to Kaspa wallets?{" "}
              <a
                href="https://docs.kasware.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#02abb8] hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



