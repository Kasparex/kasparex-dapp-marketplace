/**
 * KasWare Wallet Connect Button
 * 
 * Built using the L1 Kaspa wallet connection SDK
 * Provides full wallet integration with balance fetching and transaction support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from './Avatar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useBalanceVisibility, formatBalanceForDisplay } from '@/hooks/useBalanceVisibility';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { SendTransactionModal } from './modals/SendTransactionModal';
import { KRC20OrderModal } from './modals/KRC20OrderModal';
import { UtxoViewerModal } from './modals/UtxoViewerModal';
import { getErrorMessage } from '@/lib/utils';
import { getKRC20Balance, getUtxoEntries } from '@/lib/kaspa/kasware';
import type { KaspaTransactionRequest } from '@/lib/kaspa/types';

export function KasWareWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useKaspaBalance();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [krc20Tokens, setKrc20Tokens] = useState<Array<{ tick: string; amount: string | number; [key: string]: any }>>([]);
  const [krc20TokensLoading, setKrc20TokensLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUtxoModalOpen, setIsUtxoModalOpen] = useState(false);
  const [isKRC20ModalOpen, setIsKRC20ModalOpen] = useState(false);
  const [krc20ModalMode, setKrc20ModalMode] = useState<'create' | 'buy' | 'cancel'>('create');

  // Check if KasWare is installed
  const isKasWareInstalled = detectKaspaWallets().some(w => w.id === 'kasware' && w.isInstalled);

  // Format address for display
  const formatAddressForDisplay = (addr: string): string => {
    const formatted = formatKaspaAddress(addr);
    return formatted.display;
  };


  // Fetch KRC-20 tokens when connected
  useEffect(() => {
    if (!state.isConnected || state.provider !== 'kasware') {
      setKrc20Tokens([]);
      return;
    }

    const fetchKRC20Tokens = async () => {
      setKrc20TokensLoading(true);
      try {
        const tokens = await getKRC20Balance();
        setKrc20Tokens(tokens || []);
      } catch (err) {
        console.error('Failed to fetch KRC-20 tokens:', err);
        setKrc20Tokens([]);
      } finally {
        setKrc20TokensLoading(false);
      }
    };

    fetchKRC20Tokens();
    const interval = setInterval(fetchKRC20Tokens, 60000);
    return () => clearInterval(interval);
  }, [state.isConnected, state.provider]);


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Connect to KasWare wallet
  const handleConnect = async () => {
    if (!isKasWareInstalled) {
      setError('KasWare wallet is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connect('kasware', {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex dApps!',
          appName: 'Kasparex dApps',
        },
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to connect to KasWare wallet');
      setError(errorMessage);
      console.error('KasWare connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!state.address) return;
    
    try {
      await navigator.clipboard.writeText(state.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // If connected, show button with balance and address
  if (state.isConnected && state.address && state.provider === 'kasware') {
    const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
    const displayAddress = formatAddressForDisplay(state.address);
    const displayBalance = formatBalanceForDisplay(balance, 'KAS', false, isBalanceVisible);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="KasWare Wallet"
        >
          {/* Balance on left */}
          <span className="text-zinc-900 dark:text-zinc-100">{displayBalance}</span>
          
          {/* Avatar */}
          <Avatar address={addressWithoutPrefix} size={20} />
          
          {/* Address on right */}
          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">KasWare</span>
          
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">KasWare Wallet</span>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                  Connected
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
                {state.address}
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={handleCopyAddress}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy Address'}
              </button>

              <button
                onClick={() => {
                  setIsSendModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send KAS
              </button>

              <button
                onClick={() => {
                  setIsUtxoModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View UTXOs
              </button>

              <button
                onClick={() => {
                  setKrc20ModalMode('create');
                  setIsKRC20ModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                KRC-20 Tokens ({krc20Tokens.length})
              </button>

              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2" />

              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <SendTransactionModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            refreshBalance();
          }}
          currentBalance={balance}
          address={state.address}
        />
        
        <UtxoViewerModal
          isOpen={isUtxoModalOpen}
          onClose={() => setIsUtxoModalOpen(false)}
        />
        
        <KRC20OrderModal
          isOpen={isKRC20ModalOpen}
          onClose={() => setIsKRC20ModalOpen(false)}
          mode={krc20ModalMode}
          krc20Tokens={krc20Tokens}
          currentBalance={balance}
        />
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <button
      onClick={handleConnect}
      disabled={!isKasWareInstalled || isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isKasWareInstalled ? 'Connect KasWare' : 'Install KasWare'}
        </>
      )}
    </button>
  );
}

