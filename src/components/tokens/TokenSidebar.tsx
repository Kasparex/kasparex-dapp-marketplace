/**
 * Token Sidebar
 * Sticky navigation sidebar with scroll-to-section functionality
 * Matches standard sidebar design with black background, show/hide, and drag resize
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import type { Token } from '@/lib/tokens/types';
import { loadTokenLogoUrl, loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';
import { isAdminAddress } from '@/lib/admin';

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
  const { address: connectedAddress, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState<string>('info');
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const isAdmin = connectedAddress ? isAdminAddress(connectedAddress) : false;

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('token-sidebar-hidden');
    const savedWidth = localStorage.getItem('token-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('token-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('token-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - sidebarRect.left;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

  const logoUrl = loadTokenLogoUrl(token);
  const featuredImageUrl = loadTokenFeaturedImageUrl(token);

  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;

  return (
    <>
      {/* Show Sidebar Button - Fixed when hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="hidden lg:block fixed left-0 top-20 z-[60] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Show sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          hidden lg:block flex-shrink-0
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          overflow-y-auto
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isHidden ? 'translate-x-[-100%]' : ''}
        `}
        style={{
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : '',
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
            if (isOnBorder) {
              sidebarRef.current.style.borderRight = '2px solid #06b6d4';
            } else {
              sidebarRef.current.style.borderRight = '';
            }
          }
        }}
        onMouseLeave={() => {
          if (sidebarRef.current && !isResizing) {
            sidebarRef.current.style.borderRight = '';
          }
        }}
        onMouseDown={(e) => {
          if (!isHidden && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
              e.preventDefault();
              setIsResizing(true);
            }
          }
        }}
      >
        {/* Header with Hide Button and Back Button */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/tokens"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tokens
            </Link>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`p-4 ${isHidden ? 'lg:hidden' : ''}`}>
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

            <div className="flex items-center justify-between gap-2">
              <TokenLogo token={token} size={48} showName={true} showSymbol={true} />
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
          <nav className="space-y-1 mt-6">
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
      </aside>
    </>
  );
}
