'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProfileData } from '@/hooks/useProfile';
import { TokenBalance } from './TokenBalance';

interface ProfileSidebarProps {
  walletAddress: string;
  emoji: string;
  profile: ProfileData;
  isOwnProfile: boolean;
  isEditMode?: boolean;
  onToggleEdit?: () => void;
  onProfileUpdate: (updates: Partial<ProfileData>) => void;
}

export function ProfileSidebar({
  walletAddress,
  emoji,
  profile,
  isOwnProfile,
  isEditMode,
  onToggleEdit,
  onProfileUpdate,
}: ProfileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [tokenHoldingsExpanded, setTokenHoldingsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

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
      {expanded && <div>{children}</div>}
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

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-auto lg:max-h-[calc(100vh-4rem)]
          w-64 lg:w-full
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 lg:p-6">
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
            icon={<span>📊</span>}
            expanded={overviewExpanded}
            onToggle={() => setOverviewExpanded(!overviewExpanded)}
          >
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="text-6xl select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                  {emoji}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">Display Name</div>
                <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {profile.displayName || 'Unnamed User'}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-zinc-500 dark:text-zinc-400 mb-1">Wallet Address</div>
                <div className="text-zinc-900 dark:text-zinc-100 font-mono text-xs break-all">
                  {walletAddress}
                </div>
              </div>
              {profile.bio && (
                <div className="text-sm">
                  <div className="text-zinc-500 dark:text-zinc-400 mb-1">Bio</div>
                  <div className="text-zinc-900 dark:text-zinc-100">
                    {profile.bio}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Token Holdings Section */}
          <CollapsibleSection
            title="Token Holdings"
            icon={<span>💰</span>}
            expanded={tokenHoldingsExpanded}
            onToggle={() => setTokenHoldingsExpanded(!tokenHoldingsExpanded)}
          >
            <div className="space-y-3 mb-4">
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
                <div className="text-zinc-500 dark:text-zinc-400 mb-2">Native Balance</div>
                <TokenBalance 
                  address={walletAddress as `0x${string}`}
                  hideBalance={profile.hideBalance}
                />
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Additional tokens coming soon
              </div>
            </div>
          </CollapsibleSection>

          {/* Settings Section (only for own profile) */}
          {isOwnProfile && onToggleEdit && (
            <CollapsibleSection
              title="Settings"
              icon={<span>⚙️</span>}
              expanded={settingsExpanded}
              onToggle={() => setSettingsExpanded(!settingsExpanded)}
            >
              <div className="space-y-3 mb-4">
                <button
                  onClick={onToggleEdit}
                  className="w-full text-left px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </CollapsibleSection>
          )}

          {/* Privacy Settings Section (only for own profile) */}
          {isOwnProfile && (
            <CollapsibleSection
              title="Privacy"
              icon={<span>🔒</span>}
              expanded={privacyExpanded}
              onToggle={() => setPrivacyExpanded(!privacyExpanded)}
            >
              <div className="space-y-3 mb-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Prevent Screenshots
                  </span>
                  <input
                    type="checkbox"
                    checked={profile.preventScreenshots}
                    onChange={(e) => onProfileUpdate({ preventScreenshots: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
                  />
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  When enabled, screenshots will be discouraged
                </p>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </aside>
    </>
  );
}

