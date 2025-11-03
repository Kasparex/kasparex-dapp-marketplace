/**
 * Kaspa Wallet Connect Button
 * 
 * Button component for connecting/disconnecting Kaspa wallets
 */

'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { KaspaWalletModal } from './KaspaWalletModal';

export function KaspaWalletButton() {
  const { state, disconnect } = useKaspaWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (state.isConnected) {
      // Show disconnect option or menu
      disconnect();
    } else {
      setIsModalOpen(true);
    }
  };

  const addressDisplay = state.address 
    ? formatKaspaAddress(state.address).display
    : null;

  return (
    <>
      <button
        onClick={handleClick}
        className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center gap-2"
      >
        {state.isConnected ? (
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

      <KaspaWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

