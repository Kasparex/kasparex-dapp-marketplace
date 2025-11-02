'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from './ThemeProvider';

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

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [logoError, setLogoError] = useState(false);
  const [dAppsDropdownOpen, setDAppsDropdownOpen] = useState(false);

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
                onMouseEnter={() => setDAppsDropdownOpen(true)}
                onMouseLeave={() => setDAppsDropdownOpen(false)}
                className="inline-flex items-center gap-1 cursor-pointer"
              >
                <button
                  className="text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors"
                >
                  dApps
                </button>
                <svg
                  className={`w-4 h-4 text-zinc-900 dark:text-zinc-100 transition-transform ${dAppsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {dAppsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
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
              <ConnectButton />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

