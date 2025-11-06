'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { useTheme } from './ThemeProvider';
import { UserMenu } from './UserMenu';
import { getChainById } from '@/lib/wagmi';
import { KasWareWalletButton } from './KasWareWalletButton';
import { EVMWalletButton } from './EVMWalletButton';
import Link from 'next/link';

interface ProjectLink {
  name: string;
  subdomain: string;
  comingSoon?: boolean;
}

const projectLinks: ProjectLink[] = [
  { name: 'Tokens', subdomain: 'tokens.kasparex.com', comingSoon: true },
  { name: 'DeFi', subdomain: 'defi.kasparex.com', comingSoon: true },
  { name: 'Records', subdomain: 'records.kasparex.com', comingSoon: true },
  { name: 'Music', subdomain: 'music.kasparex.com', comingSoon: true },
  { name: 'Movies', subdomain: 'movies.kasparex.com', comingSoon: true },
  { name: 'Magazines', subdomain: 'magazines.kasparex.com', comingSoon: true },
];

function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();
  const chain = chainId ? getChainById(chainId) : null;

  if (!isConnected) {
    return null;
  }

  // Determine if it's a mainnet or testnet based on chain properties
  const isTestnet = chain?.testnet ?? false;
  const isMainnet = !isTestnet;

  // Color classes based on network type (matching card badge colors)
  const bgColorClass = isMainnet
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/40'
    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/40';

  return (
    <button
      onClick={() => openChainModal?.()}
      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center gap-2 ${bgColorClass}`}
      aria-label="Switch network"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
      <span className="hidden sm:inline">
        {chain?.name || 'Switch Network'}
      </span>
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}


export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useAccount();
  const [logoError, setLogoError] = useState(false);
  const [dAppsDropdownOpen, setDAppsDropdownOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="flex h-16 items-center justify-between w-full">
        {/* Left side: Logo and Title - no padding, flush to left */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 lg:pl-6">
          {!logoError ? (
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <Image
                src="/kasparex-oval.png"
                alt="Kasparex Logo"
                fill
                className="object-contain"
                priority
                unoptimized
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                K
              </span>
            </div>
          )}
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex items-center gap-2">
            <span className="uppercase">
              <span className="font-bold">KASPA</span>
              <span className="font-normal">REX</span>
            </span>
            <span className="text-[#02abb8]">𐤊</span>
            <span className="relative">
              <div
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setDAppsDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setDAppsDropdownOpen(false);
                  }, 500);
                }}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <button
                  className="text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors"
                >
                  dApps
                </button>
                <svg
                  className="w-4 h-4 text-zinc-900 dark:text-zinc-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {dAppsDropdownOpen && (
                  <div
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(() => {
                        setDAppsDropdownOpen(false);
                      }, 500);
                    }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden"
                  >
                    {projectLinks.map((project) => (
                      <a
                        key={project.subdomain}
                        href={`https://${project.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span>{project.name}</span>
                          {project.comingSoon && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </span>
          </h1>
        </div>

        {/* Right side: Wallet Connect and Theme Toggle - no padding, flush to right */}
        <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 lg:pr-6">
          <Link
            href="/updates"
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            aria-label="View updates timeline"
            title="Development Timeline"
          >
            <svg
              className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <div className="flex-shrink-0">
            <Suspense fallback={<div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs sm:text-sm">Loading...</div>}>
              <NetworkSwitcher />
            </Suspense>
          </div>
          <div className="flex-shrink-0">
            <KasWareWalletButton />
          </div>
          <div className="flex-shrink-0">
            <Suspense fallback={<div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs sm:text-sm">Loading...</div>}>
              <EVMWalletButton />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

