/**
 * Kaspa Wallet Connect Button
 * 
 * Button component for connecting/disconnecting Kaspa wallets with dropdown (matching EVM wallet style)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { Avatar } from './Avatar';

export function KaspaWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format address: kasp...henj (first 4 and last 4 chars, no kaspa: prefix in display)
  const formatAddressForDisplay = (address: string): string => {
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    if (addressWithoutPrefix.length <= 8) {
      return addressWithoutPrefix;
    }
    const first4 = addressWithoutPrefix.substring(0, 4);
    const last4 = addressWithoutPrefix.substring(addressWithoutPrefix.length - 4);
    return `${first4}...${last4}`;
  };

  // Fetch Kaspa balance
  useEffect(() => {
    if (!state.isConnected || !state.address) {
      setBalance(null);
      return;
    }

    const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
    let isCancelled = false;

    const extractBalance = (data: any): number | null => {
      // Try multiple response formats
      let balanceValue: string | number | null = null;
      
      if (data.balance !== undefined) {
        balanceValue = data.balance;
      } else if (data.balanceInfo?.balance !== undefined) {
        balanceValue = data.balanceInfo.balance;
      } else if (data.data?.balance !== undefined) {
        balanceValue = data.data.balance;
      } else if (data.result?.balance !== undefined) {
        balanceValue = data.result.balance;
      } else if (data.balanceInfo?.balanceInfo?.balance !== undefined) {
        balanceValue = data.balanceInfo.balanceInfo.balance;
      }

      if (balanceValue !== null) {
        const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
        if (!isNaN(balanceNum) && balanceNum >= 0) {
          return balanceNum;
        }
      }
      return null;
    };

    const fetchBalance = async () => {
      // Try kas.fyi API first (more reliable)
      try {
        const response = await fetch(`https://api.kas.fyi/v1/addresses/${addressWithoutPrefix}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const balanceValue = extractBalance(data);

        if (!isCancelled && balanceValue !== null) {
          // Convert from smallest unit (sompis) to KAS (1 KAS = 10^8 sompis)
          const kasBalance = (balanceValue / 100000000).toFixed(2);
          setBalance(kasBalance);
          return;
        }
      } catch (error) {
        console.debug('kas.fyi API failed, trying fallback:', error);
      }

      // Fallback: try kaspa.org explorer API
      if (!isCancelled) {
        try {
          const response = await fetch(`https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          const balanceValue = extractBalance(data);

          if (!isCancelled && balanceValue !== null) {
            const kasBalance = (balanceValue / 100000000).toFixed(2);
            setBalance(kasBalance);
            return;
          }
        } catch (error) {
          console.debug('kaspa.org API also failed:', error);
        }
      }

      if (!isCancelled) {
        setBalance(null);
      }
    };

    fetchBalance();

    return () => {
      isCancelled = true;
    };
  }, [state.isConnected, state.address]);

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
      // Copy full address with kaspa: prefix
      const fullAddress = state.address.startsWith('kaspa:') 
        ? state.address 
        : `kaspa:${state.address}`;
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsDropdownOpen(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsDropdownOpen(false);
  };

  // If connected, show button matching EVM wallet button style exactly
  if (state.isConnected && state.address) {
    const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
    const displayAddress = formatAddressForDisplay(state.address);
    const displayBalance = balance !== null ? `${balance} KAS` : '0 KAS';
    
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          aria-label="Kaspa L1 Wallet"
        >
          {/* Balance on left */}
          <span className="text-zinc-900 dark:text-zinc-100">{displayBalance}</span>
          
          {/* Avatar */}
          <Avatar address={addressWithoutPrefix} size={20} />
          
          {/* Address on right */}
          <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
          <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">Kaspa L1</span>
          
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

        {/* Dropdown menu (matching EVM wallet dropdown style) */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Address Section (no avatar) */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                {displayAddress}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
                {displayBalance}
              </div>
            </div>
            
            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleCopyAddress}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
              
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If not connected, show connect button
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
