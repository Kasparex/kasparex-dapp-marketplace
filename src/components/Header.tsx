'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { client } from '@/app/client';
import { useTheme } from './ThemeProvider';

// Dynamically import ConnectButton and createWallet to prevent blocking
const ConnectButton = dynamic(
  () => import('thirdweb/react').then((mod) => mod.ConnectButton),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
        Loading...
      </div>
    ),
  }
);

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [logoError, setLogoError] = useState(false);
  const [wallets, setWallets] = useState<any[] | undefined>(undefined);

  // Create wallets array on mount - only external wallets (no in-app wallet = no email/social login)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('thirdweb/wallets').then((mod) => {
        setWallets([
          mod.createWallet('io.metamask'),
          mod.createWallet('com.coinbase.wallet'),
          mod.createWallet('me.rainbow'),
          mod.createWallet('io.rabby'),
          mod.createWallet('io.zerion.wallet'),
        ]);
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="flex h-16 items-center justify-between w-full">
        {/* Left side: Logo and Title - no padding, flush to left */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 lg:pl-6">
          {!logoError ? (
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <Image
                src="/kaspa-logo.png"
                alt="Kaspa Logo"
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
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            Kasparex dApps
          </h1>
        </div>

        {/* Right side: Wallet Connect and Theme Toggle - no padding, flush to right */}
        <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 lg:pr-6">
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
              <ConnectButton
                client={client}
                connectModal={{ size: 'compact' }}
                wallets={wallets}
                appMetadata={{
                  name: 'Kasparex dApps',
                  url: typeof window !== 'undefined' ? window.location.origin : '',
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

