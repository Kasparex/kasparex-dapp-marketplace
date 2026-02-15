/**
 * Tokens Listing Sidebar
 * Sidebar for the tokens listing page with filters and info
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface TokensListingSidebarProps {
  // Can add filter props here if needed
}

function TokenLinkIcon({ id, className = "" }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  switch (id) {
    case 'hub': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'dapps': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'rewards': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2v-2m0 13V5.5A2.5 2.5 0 1019.5 8V19M12 8l-4-4m4 4l4-4" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

export function TokensListingSidebar({ }: TokensListingSidebarProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('tokens-listing-sidebar-hidden');
    const savedWidth = localStorage.getItem('tokens-listing-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('tokens-listing-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('tokens-listing-sidebar-width', String(sidebarWidth));
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
        {/* Header with Hide Button */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Kasparex Tokens
            </h2>
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
          <div className="space-y-6">
            {/* Info Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                About Kasparex Tokens
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Explore all tokens in the Kasparex ecosystem, including global tokens like KREX and GRID,
                and collaboration tokens.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Quick Links
              </h3>
              <div className="space-y-1">
                <Link
                  href="/hub"
                  className="k-sidebar-item text-zinc-600 dark:text-zinc-400 group"
                >
                  <TokenLinkIcon id="hub" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">Back to Hub</span>
                </Link>
                <Link
                  href="/dapps"
                  className="k-sidebar-item text-zinc-600 dark:text-zinc-400 group"
                >
                  <TokenLinkIcon id="dapps" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">Explore dApps</span>
                </Link>
                <Link
                  href="/points"
                  className="k-sidebar-item text-zinc-600 dark:text-zinc-400 group"
                >
                  <TokenLinkIcon id="rewards" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">View Rewards</span>
                </Link>
              </div>
            </div>

            {/* Token Types Info */}
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Token Types
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Global:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 ml-1">
                    Ecosystem-wide tokens (KREX, GRID)
                  </span>
                </div>
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">GRID:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 ml-1">
                    Global reward token earned across all dApps
                  </span>
                </div>
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Collab:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 ml-1">
                    Collaboration tokens
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
