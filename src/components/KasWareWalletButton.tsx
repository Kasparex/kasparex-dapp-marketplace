/**
 * KasWare Wallet Connect Button
 * 
 * Dedicated button for connecting to KasWare wallet with full connection flow:
 * Connect → Select Account → Signature Request
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from './Avatar';
import { getKRC20Balance } from '@/lib/kaspa/kasware';
import type { KasWareAPI } from '@/lib/kaspa/kasware';
import { SendTransactionModal } from './modals/SendTransactionModal';
import { KRC20OrderModal } from './modals/KRC20OrderModal';
import { UtxoViewerModal } from './modals/UtxoViewerModal';
import { getErrorMessage } from '@/lib/utils';
import { createSIWKMessage, signInWithKaspa } from '@/lib/kaspa/auth';

interface KasWareWindow {
  kasware?: KasWareAPI;
}

export function KasWareWalletButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [krc20Tokens, setKrc20Tokens] = useState<Array<{ tick: string; amount: string | number; [key: string]: any }>>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUtxoModalOpen, setIsUtxoModalOpen] = useState(false);
  const [isKRC20ModalOpen, setIsKRC20ModalOpen] = useState(false);
  const [krc20ModalMode, setKrc20ModalMode] = useState<'create' | 'buy' | 'cancel'>('create');

  // Check if KasWare is installed
  const isKasWareInstalled = typeof window !== 'undefined' && !!(window as KasWareWindow).kasware;

  // Format address for display: kasp...henj (includes "kaspa" prefix)
  const formatAddressForDisplay = (addr: string): string => {
    // Remove kaspa: prefix to get the address part
    const addressWithoutPrefix = addr.replace(/^kaspa:/i, '');
    if (addressWithoutPrefix.length <= 8) {
      return `kaspa:${addressWithoutPrefix}`;
    }
    // Show first 4 chars of "kaspa" + "..." + last 4 chars of address
    // Format: kasp...henj
    const last4 = addressWithoutPrefix.substring(addressWithoutPrefix.length - 4);
    return `kasp...${last4}`;
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

    let isCancelled = false;
    let currentBalance: string | null = null;

    const fetchBalance = async () => {
      try {
        const kasware = (window as KasWareWindow).kasware;
        
        if (!kasware) {
          console.warn('KasWare wallet not available');
          if (!isCancelled && currentBalance === null) {
            setBalance('0.00');
          }
          return;
        }

        // Check if wallet is connected (optional check - don't block if method doesn't exist)
        const isWalletConnected = typeof kasware.isConnected === 'function' 
          ? kasware.isConnected() 
          : true; // Assume connected if method doesn't exist
        
        if (!isWalletConnected) {
          console.warn('KasWare wallet not connected');
          if (!isCancelled && currentBalance === null) {
            setBalance('0.00');
          }
          return;
        }

        // Try KasWare's getBalance() method first - this is the primary method
        if (typeof kasware.getBalance === 'function') {
          try {
            console.log('Calling kasware.getBalance()...');
            const balanceResult = await kasware.getBalance();
            console.log('KasWare getBalance() result:', balanceResult);
            
            if (!isCancelled) {
              let balanceValue: string | number | null = null;
              
              // Handle different response formats
              if (typeof balanceResult === 'string' || typeof balanceResult === 'number') {
                balanceValue = balanceResult;
              } else if (balanceResult && typeof balanceResult === 'object') {
                // Try different possible properties
                const resultObj = balanceResult as Record<string, any>;
                if ('balance' in resultObj) {
                  balanceValue = resultObj.balance;
                } else if ('amount' in resultObj) {
                  balanceValue = resultObj.amount;
                } else if ('value' in resultObj) {
                  balanceValue = resultObj.value;
                }
              }

              if (balanceValue !== null && balanceValue !== undefined && balanceValue !== '') {
                const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
                if (!isNaN(balanceNum) && balanceNum >= 0) {
                  // KasWare getBalance() returns balance in sompis (smallest unit, standard for Kaspa wallets)
                  // Convert to KAS: 1 KAS = 10^8 sompis
                  // Only treat as KAS if it's a very small decimal number (< 0.01) with many decimal places
                  let kasBalance: string;
                  const strValue = balanceNum.toString();
                  const hasDecimals = strValue.includes('.');
                  const decimalPlaces = hasDecimals ? strValue.split('.')[1]?.length || 0 : 0;
                  
                  // If balance < 0.01 and has > 6 decimal places, likely already in KAS
                  if (balanceNum < 0.01 && decimalPlaces > 6) {
                    kasBalance = balanceNum.toFixed(8);
                  } else {
                    // Otherwise, assume it's in sompis and convert to KAS
                    kasBalance = (balanceNum / 100000000).toFixed(2);
                  }
                  
                  currentBalance = kasBalance;
                  setBalance(kasBalance);
                  console.log(`✓ KasWare balance from wallet: ${kasBalance} KAS (raw: ${balanceNum} sompis)`);
                  return;
                } else {
                  console.warn('Invalid balance number:', balanceNum);
                }
              } else {
                console.warn('Balance value is null/undefined/empty:', balanceValue);
              }
            }
          } catch (walletError) {
            console.error('KasWare getBalance() error:', walletError);
            console.warn('Trying API fallback...');
          }
        } else {
          console.warn('kasware.getBalance() is not a function, using API fallback');
        }

        // Fallback to API if getBalance() is not available or failed
        // Use address without prefix for API call (API will handle normalization)
        const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
        const response = await fetch(`/api/kaspa/balance?address=${encodeURIComponent(address)}`, {
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

        if (!isCancelled) {
          if (result.success && result.balance !== null && result.balance !== undefined && result.balance !== '') {
            const balanceNum = parseFloat(result.balance);
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              // Balance is in sompis, convert to KAS (1 KAS = 10^8 sompis)
              const kasBalance = (balanceNum / 100000000).toFixed(2);
              currentBalance = kasBalance;
              setBalance(kasBalance);
              console.log(`KasWare balance from API: ${kasBalance} KAS (from ${result.source || 'api'})`);
              return;
            }
          }
          
          // Only set to 0 if we don't have a previous balance
          if (!isCancelled && currentBalance === null) {
            setBalance('0.00');
          }
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        if (!isCancelled && currentBalance === null) {
          setBalance('0.00');
        }
      }
    };

    // Fetch immediately
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

  // Fetch KRC-20 token balances when connected
  useEffect(() => {
    if (!isConnected || !address) {
      setKrc20Tokens([]);
      return;
    }

    let isCancelled = false;

    const fetchKRC20Balances = async () => {
      try {
        const tokens = await getKRC20Balance();
        if (!isCancelled) {
          setKrc20Tokens(tokens || []);
          console.log('KRC-20 tokens:', tokens);
        }
      } catch (error) {
        console.warn('Failed to fetch KRC-20 balances:', error);
        if (!isCancelled) {
          setKrc20Tokens([]);
        }
      }
    };

    fetchKRC20Balances();

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      if (!isCancelled) {
        fetchKRC20Balances();
      }
    }, 60000);

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

      // Step 2: Request signature for authentication using SIWK format
      // Uses standardized Sign-In with Kaspa (SIWK) message format
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com';
      const appName = 'Kasparex dApps';
      
      // Create SIWK authentication message with full SIWK parameters
      const signMessage = createSIWKMessage({
        domain,
        address: normalizedAddress,
        statement: `Welcome to ${appName}!`,
        uri: typeof window !== 'undefined' ? window.location.origin : `https://${domain}`,
        version: '1',
        chainId: 'kaspa:mainnet',
        nonce: crypto.randomUUID(),
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
      });

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

      // Immediately fetch balance after connection
      try {
        const balanceResult = await kasware.getBalance();
        if (balanceResult !== null && balanceResult !== undefined) {
          let balanceValue: string | number | null = null;
          
          if (typeof balanceResult === 'string' || typeof balanceResult === 'number') {
            balanceValue = balanceResult;
          } else if (balanceResult && typeof balanceResult === 'object') {
            const resultObj = balanceResult as Record<string, any>;
            if ('balance' in resultObj) {
              balanceValue = resultObj.balance;
            } else if ('amount' in resultObj) {
              balanceValue = resultObj.amount;
            } else if ('value' in resultObj) {
              balanceValue = resultObj.value;
            }
          }

          if (balanceValue !== null && balanceValue !== undefined && balanceValue !== '') {
            const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              // Convert from sompis to KAS
              const strValue = balanceNum.toString();
              const hasDecimals = strValue.includes('.');
              const decimalPlaces = hasDecimals ? strValue.split('.')[1]?.length || 0 : 0;
              
              let kasBalance: string;
              if (balanceNum < 0.01 && decimalPlaces > 6) {
                kasBalance = balanceNum.toFixed(8);
              } else {
                kasBalance = (balanceNum / 100000000).toFixed(2);
              }
              
              setBalance(kasBalance);
              console.log(`✓ Balance fetched on connect: ${kasBalance} KAS (raw: ${balanceNum})`);
            }
          }
        }
      } catch (balanceError) {
        console.warn('Failed to fetch balance immediately after connection, will retry:', balanceError);
        // Balance will be fetched by useEffect hook
      }
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
    // Show balance if available, otherwise show loading state
    const displayBalance = balance !== null && balance !== undefined && balance !== '' 
      ? `${balance} KAS` 
      : balance === null 
        ? 'Loading...' 
        : '0.00 KAS';

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
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[9999] overflow-hidden">
            {/* Wallet Info Section */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 mb-2">
                {displayAddress}
              </div>
              <button
                onClick={handleCopyAddress}
                className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                KasWare Wallet
              </div>
            </div>
            
            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsSendModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
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
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View UTXOs
              </button>
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
              
              <button
                onClick={() => {
                  setKrc20ModalMode('create');
                  setIsKRC20ModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create KRC-20 Order
              </button>
              
              <button
                onClick={() => {
                  setKrc20ModalMode('buy');
                  setIsKRC20ModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buy KRC-20 Token
              </button>
              
              <button
                onClick={() => {
                  setKrc20ModalMode('cancel');
                  setIsKRC20ModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel KRC-20 Order
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
        
        {/* Modals */}
        <SendTransactionModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            // Refresh balance after sending
            if (isConnected && address) {
              const fetchBalance = async () => {
                try {
                  const kasware = (window as KasWareWindow).kasware;
                  if (kasware && typeof kasware.getBalance === 'function') {
                    const balanceResult = await kasware.getBalance();
                    if (balanceResult !== null && balanceResult !== undefined) {
                      let balanceValue: string | number;
                      if (typeof balanceResult === 'object' && 'balance' in balanceResult) {
                        balanceValue = balanceResult.balance;
                      } else if (typeof balanceResult === 'object' && 'amount' in balanceResult) {
                        balanceValue = (balanceResult as any).amount;
                      } else if (typeof balanceResult === 'object' && 'value' in balanceResult) {
                        balanceValue = (balanceResult as any).value;
                      } else {
                        balanceValue = balanceResult;
                      }
                      const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
                      if (!isNaN(balanceNum) && balanceNum >= 0) {
                        const kasBalance = balanceNum > 1000000 
                          ? (balanceNum / 100000000).toFixed(2) 
                          : balanceNum.toFixed(2);
                        setBalance(kasBalance);
                      }
                    }
                  }
                } catch (err) {
                  console.error('Error refreshing balance:', err);
                }
              };
              fetchBalance();
            }
          }}
          currentBalance={balance}
          address={address}
        />
        
        <UtxoViewerModal
          isOpen={isUtxoModalOpen}
          onClose={() => setIsUtxoModalOpen(false)}
        />
        
        <KRC20OrderModal
          isOpen={isKRC20ModalOpen}
          onClose={() => setIsKRC20ModalOpen(false)}
          mode={krc20ModalMode}
          currentBalance={balance}
          krc20Tokens={krc20Tokens}
        />
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
        <div className="absolute top-full right-0 mt-2 w-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-lg z-[9999]">
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

