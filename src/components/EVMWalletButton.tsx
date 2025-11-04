/**
 * EVM Wallet Button
 * 
 * Custom button component for EVM wallets with dropdown (replacing RainbowKit modal)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Avatar } from './Avatar';

export function EVMWalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openChainModal } = useChainModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: isConnected && !!address,
    },
  });

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

  if (!isConnected || !address) {
    return null;
  }

  const handleChangeNetwork = () => {
    openChainModal?.();
    setIsDropdownOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Format address for display: first 4 and last 4 chars
  const formatAddress = (addr: string): string => {
    if (addr.length <= 8) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const displayBalance = balance 
    ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(2)} ${balance.symbol}`
    : '0 KAS';
  const displayAddress = formatAddress(address);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        aria-label="EVM Wallet"
      >
        {/* Balance on left */}
        <span className="text-zinc-900 dark:text-zinc-100">{displayBalance}</span>
        
        {/* Avatar */}
        <Avatar address={address} size={20} />
        
        {/* Address on right */}
        <span className="text-zinc-900 dark:text-zinc-100 hidden sm:inline">{displayAddress}</span>
        <span className="text-zinc-900 dark:text-zinc-100 sm:hidden">L2</span>
        
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
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Connected Wallet
            </div>
            <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
              {address}
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
              {displayBalance}
            </div>
          </div>
          
          <div className="py-1">
            <button
              onClick={handleChangeNetwork}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change Network
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

