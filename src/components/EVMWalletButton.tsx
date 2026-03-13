/**
 * EVM Wallet Button
 * 
 * Custom button component for EVM wallets - shows connect button when disconnected,
 * and opens UserMenu dropdown when connected
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi';
import { ConnectButton, useChainModal } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Avatar } from './Avatar';
import { useBalanceVisibility, formatBalanceForDisplay, maskAddress } from '@/hooks/useBalanceVisibility';
import { getChainById } from '@/lib/wagmi';

export function EVMWalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { openChainModal } = useChainModal();
  const router = useRouter();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current network info
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = Boolean(chain?.testnet);
  const isMainnet = !isTestnet;

  // Determine dynamic network label and styling
  let networkLabel = 'L2';
  let networkBadgeColorClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-blue-600/40';
  
  if (chain) {
    const chainName = chain.name.toLowerCase();
    if (chainName.includes('kasplex')) {
      networkLabel = 'L2 Kasplex';
      // Kasplex is yellow on testnet, blue on mainnet
      networkBadgeColorClass = isMainnet
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-blue-600/40'
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40';
    } else if (chainName.includes('igra')) {
      networkLabel = 'L2 Igra';
      networkBadgeColorClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40';
    }
  }

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

  // Format address for display: first 4 and last 4 chars
  const formatAddress = (addr: string): string => {
    if (addr.length <= 8) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // If connected, show button with UserMenu dropdown
  if (isConnected && address) {
    const balanceValue = balance 
      ? parseFloat(formatUnits(balance.value, balance.decimals))
      : 0;
    const displayBalance = formatBalanceForDisplay(
      balanceValue,
      balance?.symbol || 'KAS',
      false,
      isBalanceVisible
    );
    const displayAddress = maskAddress(formatAddress(address), isBalanceVisible);
    const shortenedAddress = maskAddress(`${address.slice(0, 6)}...${address.slice(-4)}`, isBalanceVisible);

    const handleViewProfile = () => {
      router.push(`/user/${address}`);
      setIsDropdownOpen(false);
    };

    // Edit functionality removed - profiles are now read-only

    const handleChangeNetwork = () => {
      openChainModal?.();
      setIsDropdownOpen(false);
    };

    const handleCopyAddress = async () => {
      if (address) {
        if (!isBalanceVisible) {
          alert('Please enable balance visibility to copy address');
          return;
        }
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setIsDropdownOpen(false);
      }
    };

    const handleDisconnect = () => {
      disconnect();
      setIsDropdownOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium relative"
          aria-label="EVM Wallet"
        >
          {/* Network badge - clickable to change network (span to avoid nested button) */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleChangeNetwork();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleChangeNetwork();
              }
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer shadow-sm ${networkBadgeColorClass}`}
            title="Click to change network"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            {networkLabel}
            {isTestnet && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200/80 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100">
                Testnet
              </span>
            )}
          </span>
          
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

        {/* UserMenu Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[9999] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-100 mb-3">
                {shortenedAddress}
              </div>
              
              {/* Balance Display in Dropdown */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 mb-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">KAS Balance</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{displayBalance}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">KAS</span>
                </div>
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
                onClick={() => {
                  router.push('/rewards-calculator');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Reward Calculator
              </button>
              
              <button
                onClick={() => {
                  router.push('/points');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All Perks
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

  // If not connected, show Connect Wallet button
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        const ready = mounted;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            <button
              onClick={openConnectModal}
              type="button"
              className="px-3 py-2 rounded-lg bg-[#0097b2] text-white hover:bg-[#007a91] transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect EVM Wallet
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
