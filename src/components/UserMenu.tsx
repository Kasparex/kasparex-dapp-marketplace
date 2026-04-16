'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { Avatar } from './Avatar';

export function UserMenu() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openChainModal } = useChainModal();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isConnected || !address) {
    return null;
  }

  const handleViewProfile = () => {
    router.push(`/u/${encodeURIComponent(address)}`);
    setIsOpen(false);
  };

  // Edit functionality removed - profiles are now read-only

  const handleChangeNetwork = () => {
    openChainModal?.();
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  // Format address for display
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        aria-label="User menu"
      >
        <Avatar address={address} size={24} />
        <svg
          className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[9999] overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Connected Wallet
            </div>
            <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
              {shortenedAddress}
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
            
            {/* Edit functionality removed - profiles are now read-only */}
            
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

