'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { ProfileData } from '@/hooks/useProfile';
import { TokenBalance } from './TokenBalance';
import { Avatar } from './Avatar';
import { DescriptionIcon, TokenIcon, SettingsIcon, PrivacyIcon } from './icons/SectionIcons';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';

interface ProfileSidebarProps {
  walletAddress: string;
  emoji: string;
  profile: ProfileData;
  isOwnProfile: boolean;
  onProfileUpdate: (updates: Partial<ProfileData>) => void;
}

export function ProfileSidebar({
  walletAddress,
  emoji,
  profile,
  isOwnProfile,
  onProfileUpdate,
}: ProfileSidebarProps) {
  const { state: kaspaState } = useKaspaWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [tokenHoldingsExpanded, setTokenHoldingsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  
  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('profile-sidebar-hidden');
    const savedWidth = localStorage.getItem('profile-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('profile-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('profile-sidebar-width', String(sidebarWidth));
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
  
  const kaspaAddressDisplay = kaspaState.address 
    ? formatKaspaAddress(kaspaState.address)
    : null;
  
  // Check if the current wallet address matches the Kaspa wallet address (without kaspa: prefix)
  const isKaspaWallet = kaspaState.isConnected && 
    kaspaState.address && 
    kaspaState.address.replace(/^kaspa:/i, '').toLowerCase() === walletAddress?.toLowerCase();

  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const CollapsibleSection = ({
    title,
    icon,
    expanded,
    onToggle,
    children,
  }: {
    title: string;
    icon?: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-white opacity-80 uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-white hover:opacity-100 transition-all"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-zinc-700 dark:text-white opacity-80">{icon}</span>
          )}
          <span>{title}</span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{children}</div>}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6 text-zinc-900 dark:text-zinc-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

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

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isHidden ? 'lg:translate-x-[-100%]' : ''}
        `}
        style={{ 
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : ''
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            // Full height border detection (right side)
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
          // Make the right border draggable (full height)
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
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to dApps
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

        <div className={`p-4 lg:p-6 ${isHidden ? 'lg:hidden' : ''}`}>
          {/* Back to Categories Button */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Categories
          </Link>

          {/* Profile Overview Section */}
          <CollapsibleSection
            title="Overview"
            icon={<DescriptionIcon />}
            expanded={overviewExpanded}
            onToggle={() => setOverviewExpanded(!overviewExpanded)}
          >
            <div className="space-y-3 mb-4">
              <Link
                href="/build-dapp"
                className="block w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm text-center"
              >
                Build dApp
              </Link>
              <Link
                href="/list-dapp"
                className="block w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm text-center"
              >
                List dApp
              </Link>
            </div>
          </CollapsibleSection>

          {/* Token Holdings Section */}
          <CollapsibleSection
            title="Token Holdings"
            icon={<TokenIcon />}
            expanded={tokenHoldingsExpanded}
            onToggle={() => setTokenHoldingsExpanded(!tokenHoldingsExpanded)}
          >
            <div className="space-y-3 mb-4">
              {/* EVM Wallet Balance (only show if wallet address is EVM format) */}
              {walletAddress && walletAddress.startsWith('0x') && (
                <div 
                  className="text-sm"
                  style={profile.hideBalance ? {
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    pointerEvents: 'none',
                  } as React.CSSProperties : {}}
                >
                  <div className="text-zinc-500 dark:text-zinc-400 mb-2">EVM Native Balance</div>
                  <TokenBalance 
                    address={walletAddress as `0x${string}`}
                    hideBalance={profile.hideBalance}
                  />
                </div>
              )}
              
              {/* Kaspa Wallet Info */}
              {isKaspaWallet && kaspaAddressDisplay && (
                <div className="text-sm">
                  <div className="text-zinc-500 dark:text-zinc-400 mb-2">Kaspa L1 Wallet</div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono break-all">
                      {kaspaAddressDisplay.display}
                    </div>
                    {kaspaState.provider && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Provider: {kaspaState.provider.charAt(0).toUpperCase() + kaspaState.provider.slice(1)}
                      </div>
                    )}
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Connected
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show Kaspa wallet info if connected but not matching this profile */}
              {kaspaState.isConnected && !isKaspaWallet && (
                <div className="text-sm">
                  <div className="text-zinc-500 dark:text-zinc-400 mb-2">Kaspa L1 Wallet</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Different wallet connected: {kaspaAddressDisplay?.display}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Additional tokens coming soon
              </div>
            </div>
          </CollapsibleSection>

          {/* Privacy Settings Section (read-only) */}
          {isOwnProfile && (
            <CollapsibleSection
              title="Privacy"
              icon={<PrivacyIcon />}
              expanded={privacyExpanded}
              onToggle={() => setPrivacyExpanded(!privacyExpanded)}
            >
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Prevent Screenshots
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    profile.preventScreenshots 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {profile.preventScreenshots ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Privacy settings are read-only
                </p>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </aside>
    </>
  );
}

