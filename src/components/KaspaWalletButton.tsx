/**
 * Kaspa Wallet Connect Button
 * 
 * Button component for connecting/disconnecting Kaspa wallets with dropdown menu
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { Avatar } from './Avatar';

export function KaspaWalletButton() {
  const { state, connect, disconnect } = useKaspaWallet();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  const handleViewProfile = () => {
    if (state.address) {
      const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
      router.push(`/user/${addressWithoutPrefix}`);
      setIsOpen(false);
    }
  };

  const handleEditProfile = () => {
    if (state.address) {
      const addressWithoutPrefix = state.address.replace(/^kaspa:/i, '');
      router.push(`/user/${addressWithoutPrefix}?edit=true`);
      setIsOpen(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsOpen(false);
  };

  const addressDisplay = state.address 
    ? formatKaspaAddress(state.address)
    : null;

  const shortenedAddress = state.address 
    ? formatKaspaAddress(state.address).display
    : null;

  // If connected, show dropdown button (similar to RainbowKit ConnectButton)
  if (state.isConnected && state.address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#02abb8] hover:bg-[#0299a3] text-white transition-colors text-sm font-medium"
          aria-label="Kaspa L1 Wallet menu"
        >
          <span className="hidden sm:inline">{shortenedAddress}</span>
          <span className="sm:hidden">Kaspa L1</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                {state.address.replace(/^kaspa:/i, '')}
              </div>
            </div>
            
            <div className="py-1">
              <button
                onClick={handleViewProfile}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
              
              <button
                onClick={handleEditProfile}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
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

  // If not connected, show connect button (styled like RainbowKit ConnectButton)
  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-2 rounded-lg bg-[#02abb8] hover:bg-[#0299a3] text-white transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="hidden sm:inline">Connecting...</span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Kaspa L1 Wallet</span>
            <span className="sm:hidden">L1 Wallet</span>
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
