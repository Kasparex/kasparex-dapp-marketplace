/**
 * KasWare Wallet Connect Button
 * 
 * Dedicated button for connecting to KasWare wallet with full connection flow:
 * Connect → Select Account → Signature Request
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from './Avatar';

interface KasWareWindow {
  kasware?: {
    requestAccounts(): Promise<string[]>;
    signMessage(message: string): Promise<string>;
    getAddress(): Promise<string | null>;
    isConnected(): boolean;
    disconnect(): Promise<void>;
    on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
    removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  };
}

export function KasWareWalletButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if KasWare is installed
  const isKasWareInstalled = typeof window !== 'undefined' && !!(window as KasWareWindow).kasware;

  // Format address for display
  const formatAddressForDisplay = (addr: string): string => {
    const addressWithoutPrefix = addr.replace(/^kaspa:/i, '');
    if (addressWithoutPrefix.length <= 8) {
      return addressWithoutPrefix;
    }
    const first4 = addressWithoutPrefix.substring(0, 4);
    const last4 = addressWithoutPrefix.substring(addressWithoutPrefix.length - 4);
    return `${first4}...${last4}`;
  };

  // Load saved connection state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedState = localStorage.getItem('kasware_wallet_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.isConnected && parsed.address) {
          setAddress(parsed.address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error loading saved wallet state:', error);
      }
    }
  }, []);

  // Fetch balance when connected
  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }

    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    let isCancelled = false;

    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/kaspa/balance?address=${encodeURIComponent(addressWithoutPrefix)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!isCancelled && result.success && result.balance) {
          const balanceNum = parseFloat(result.balance);
          if (!isNaN(balanceNum) && balanceNum >= 0) {
            const kasBalance = (balanceNum / 100000000).toFixed(2);
            setBalance(kasBalance);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }

      if (!isCancelled) {
        setBalance(null);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      if (!isCancelled) {
        fetchBalance();
      }
    }, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, address]);

  // Listen for account changes
  useEffect(() => {
    if (!isKasWareInstalled || !isConnected) return;

    const kasware = (window as KasWareWindow).kasware;
    if (!kasware) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Wallet disconnected
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
        localStorage.removeItem('kasware_wallet_state');
      } else {
        // Address changed
        const newAddress = accounts[0];
        const normalizedAddress = newAddress.startsWith('kaspa:') 
          ? newAddress 
          : `kaspa:${newAddress}`;
        setAddress(normalizedAddress);
        localStorage.setItem('kasware_wallet_state', JSON.stringify({
          isConnected: true,
          address: normalizedAddress,
        }));
      }
    };

    kasware.on('accountsChanged', handleAccountsChanged);

    return () => {
      kasware.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [isKasWareInstalled, isConnected]);

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

  // Connect with full flow: requestAccounts → signMessage
  const handleConnect = async () => {
    if (!isKasWareInstalled) {
      setError('KasWare wallet is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const kasware = (window as KasWareWindow).kasware!;

      // Step 1: Request accounts (triggers account selection modal)
      const accounts = await kasware.requestAccounts();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from KasWare wallet');
      }

      const selectedAddress = accounts[0];
      const normalizedAddress = selectedAddress.startsWith('kaspa:') 
        ? selectedAddress 
        : `kaspa:${selectedAddress}`;

      // Step 2: Request signature for authentication (triggers signature request modal)
      // This follows the pattern from KaspaCom - sign in message
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com';
      const appName = 'Kasparex dApps';
      const signMessage = `${domain} wants you to sign in with your Kaspa account:\n\n${normalizedAddress}\n\nWelcome to ${appName}!\n\nSigning is the only way we can truly know that you are the owner of the wallet you are connecting. Signing is a safe, gas-less transaction that does not in any way give ${appName} permission to perform any transactions with your wallet.`;

      try {
        await kasware.signMessage(signMessage);
        // Signature successful - connection authenticated
      } catch (signError) {
        // User rejected signature - disconnect but don't show error
        // This is expected behavior if user cancels authentication
        if (signError instanceof Error && signError.message.includes('rejected')) {
          throw new Error('Connection cancelled - signature request was rejected');
        }
        throw signError;
      }

      // Connection successful
      setAddress(normalizedAddress);
      setIsConnected(true);
      localStorage.setItem('kasware_wallet_state', JSON.stringify({
        isConnected: true,
        address: normalizedAddress,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to KasWare wallet';
      setError(errorMessage);
      console.error('KasWare connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!isKasWareInstalled) return;

    try {
      const kasware = (window as KasWareWindow).kasware;
      if (kasware && kasware.isConnected()) {
        await kasware.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    setIsConnected(false);
    setAddress(null);
    setBalance(null);
    setIsDropdownOpen(false);
    localStorage.removeItem('kasware_wallet_state');
  };

  // Copy address
  const handleCopyAddress = async () => {
    if (address) {
      const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsDropdownOpen(false);
    }
  };

  // If connected, show button with balance and address
  if (isConnected && address) {
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    const displayAddress = formatAddressForDisplay(address);
    const displayBalance = balance !== null ? `${balance} KAS` : '0 KAS';

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
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Wallet Info Section */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                {address.replace(/^kaspa:/i, '')}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
                {displayBalance}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                KasWare Wallet
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
        disabled={isConnecting || !isKasWareInstalled}
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
            <span className="hidden sm:inline">Connect KasWare</span>
            <span className="sm:hidden">KasWare</span>
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

