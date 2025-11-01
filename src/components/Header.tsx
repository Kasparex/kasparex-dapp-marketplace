'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { client } from '@/app/client';
import { useTheme } from './ThemeProvider';

// Dynamically import ConnectButton to prevent blocking
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
  const [walletError, setWalletError] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo and Title */}
          <div className="flex items-center gap-3">
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
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Kasparex dApps
            </h1>
          </div>

          {/* Right side: Wallet Connect and Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
            {!walletError ? (
              <Suspense fallback={<div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm">Loading...</div>}>
                <ConnectButton
                  client={client}
                  appMetadata={{
                    name: 'Kasparex dApps',
                    url: typeof window !== 'undefined' ? window.location.origin : '',
                  }}
                  onError={() => setWalletError(true)}
                />
              </Suspense>
            ) : (
              <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
                Wallet unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

