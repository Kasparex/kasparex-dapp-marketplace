/**
 * Kaspa Wallet Connect Button
 * 
 * Button component for connecting/disconnecting Kaspa wallets
 */

'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';

export function KaspaWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (state.isConnected) {
      // Disconnect if already connected
      await disconnect();
    } else {
      // Directly connect to KasWare
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
    }
  };

  const addressDisplay = state.address 
    ? formatKaspaAddress(state.address).display
    : null;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
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
        ) : state.isConnected ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">{addressDisplay}</span>
            <span className="sm:hidden">Kaspa</span>
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

