/**
 * Token Sidebar
 * Sticky navigation sidebar with scroll-to-section functionality
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { getTokenImageUrl } from '@/lib/tokens/metadata';

interface TokenSidebarProps {
  token: Token;
}

const SECTIONS = [
  { id: 'info', label: 'About' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'dapps', label: 'Related dApps' },
  { id: 'price', label: 'Price' },
  { id: 'balance', label: 'Your Balance' },
  { id: 'links', label: 'Links' },
] as const;

export function TokenSidebar({ token }: TokenSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('info');
  const [isHidden, setIsHidden] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for active section highlighting
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all sections
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Account for header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveSection(sectionId);
    }
  };

  const logoUrl = token.logoCid
    ? getTokenImageUrl(token.logoCid)
    : token.logo || null;
  const featuredImageUrl = token.featuredImageCid
    ? getTokenImageUrl(token.featuredImageCid)
    : token.featuredImage || null;

  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;

  return (
    <aside
      className={`${
        isHidden ? 'w-0' : 'w-64'
      } flex-shrink-0 transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900`}
    >
      <div className="sticky top-0 h-screen overflow-y-auto">
        {/* Toggle Button */}
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="absolute top-4 -right-3 z-10 w-6 h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          aria-label={isHidden ? 'Show sidebar' : 'Hide sidebar'}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isHidden ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            )}
          </svg>
        </button>

        {!isHidden && (
          <div className="p-6 space-y-6">
            {/* Token Header */}
            <div className="space-y-4">
              {featuredImageUrl && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={featuredImageUrl}
                    alt={token.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    <Image
                      src={logoUrl}
                      alt={token.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      {token.symbol.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {token.name}
                  </h1>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{token.symbol}</div>
                </div>
              </div>

              {/* Network Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    token.network === 'L1'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {token.network}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    token.type === 'global'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : token.type === 'local'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                  }`}
                >
                  {token.type}
                </span>
              </div>

              {/* Price (if available) */}
              {price !== undefined && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Price</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    {priceChange24h !== undefined && (
                      <div
                        className={`text-sm ${
                          priceChange24h >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {priceChange24h >= 0 ? '+' : ''}
                        {priceChange24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {SECTIONS.map((section) => {
                // Skip sections that might not have content
                if (section.id === 'roadmap' && !token.roadmap?.length) return null;
                if (section.id === 'dapps' && !token.relatedDAppIds?.length && !token.parentDAppId)
                  return null;
                if (section.id === 'price' && !token.price) return null;
                if (section.id === 'links' && !token.links?.length) return null;

                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 dark:text-[#02abb8]'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
