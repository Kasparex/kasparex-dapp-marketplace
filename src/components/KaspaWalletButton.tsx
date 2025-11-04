/**
 * Kaspa Wallet Connect Button
 * 
 * Button component for connecting/disconnecting Kaspa wallets with modal popup
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { Avatar } from './Avatar';

export function KaspaWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch Kaspa balance
  useEffect(() => {
    if (state.isConnected && state.address) {
      const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
      // Fetch balance from Kaspa explorer API
      fetch(`https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`)
        .then(res => res.json())
        .then(data => {
          if (data.balance) {
            // Convert from smallest unit (sompis) to KAS (1 KAS = 10^8 sompis)
            const kasBalance = (parseFloat(data.balance) / 100000000).toFixed(2);
            setBalance(kasBalance);
          }
        })
        .catch(() => {
          // Fallback: try alternative API
          fetch(`https://api.kas.fyi/v1/addresses/${addressWithoutPrefix}`)
            .then(res => res.json())
            .then(data => {
              if (data.balance) {
                const kasBalance = (parseFloat(data.balance) / 100000000).toFixed(2);
                setBalance(kasBalance);
              }
            })
            .catch(() => {
              setBalance(null);
            });
        });
    } else {
      setBalance(null);
    }
  }, [state.isConnected, state.address]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    }

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await connect('kasware');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to KasWare wallet';
      setError(errorMessage);
      console.error('KasWare connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyAddress = async () => {
    if (state.address) {
      const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
      await navigator.clipboard.writeText(addressWithoutPrefix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsModalOpen(false);
  };

  const addressDisplay = state.address 
    ? formatKaspaAddress(state.address)
    : null;

  const shortenedAddress = state.address 
    ? formatKaspaAddress(state.address).display
    : null;

  // If connected, show button with previous styling
  if (state.isConnected && state.address) {
    const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
    
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
          aria-label="Kaspa L1 Wallet"
        >
          <Avatar address={addressWithoutPrefix} size={20} />
          <span className="hidden sm:inline">{shortenedAddress}</span>
          <span className="sm:hidden">Kaspa L1</span>
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              ref={modalRef}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Avatar */}
              <div className="flex justify-center pt-6 pb-4">
                <Avatar address={addressWithoutPrefix} size={64} />
              </div>

              {/* Address */}
              <div className="px-6 pb-2 text-center">
                <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {shortenedAddress}
                </div>
              </div>

              {/* Balance */}
              <div className="px-6 pb-6 text-center">
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {balance !== null ? `${balance} KAS` : 'Loading...'}
                </div>
              </div>

              {/* Buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleCopyAddress}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not connected, show connect button with previous styling
  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-[#02abb8]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="hidden sm:inline">Connecting...</span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">Connect Kaspa</span>
            <span className="sm:hidden">Kaspa</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-lg z-50">
          <p className="text-xs text-red-800 dark:text-red-300">{error}</p>
          {error.includes('not installed') && (
            <a
              href="https://chrome.google.com/webstore/detail/hklhheigdmpoolooomdihmhlpjjdbklf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1 block"
            >
              Install KasWare →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
