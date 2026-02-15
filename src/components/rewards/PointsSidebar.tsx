'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { XPPointsBox } from './XPPointsBox';
import { KREXStatusBox } from './KREXStatusBox';
import { NFTStatusBox } from './NFTStatusBox';
import { UnifiedStatusBox } from './UnifiedStatusBox';

interface PointsSidebarProps {
  filters: {
    unlockedPerks: boolean;
    lockedPerks: boolean;
    unlockedBadges: boolean;
    lockedBadges: boolean;
    nftPerks: boolean;
    nodePerks: boolean;
  };
  onFilterChange: (filters: PointsSidebarProps['filters']) => void;
}

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

function RewardFilterIcon({ id, className = "" }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  switch (id) {
    case 'unlockedPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
    case 'lockedPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'unlockedBadges': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'lockedBadges': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'nftPerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'nodePerks': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

export function PointsSidebar({ filters, onFilterChange }: PointsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [perksExpanded, setPerksExpanded] = useState(true);
  const [badgesExpanded, setBadgesExpanded] = useState(true);

  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('points-sidebar-hidden');
    const savedWidth = localStorage.getItem('points-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('points-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('points-sidebar-width', String(sidebarWidth));
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

  const handleFilterToggle = (filterKey: keyof PointsSidebarProps['filters']) => {
    onFilterChange({
      ...filters,
      [filterKey]: !filters[filterKey],
    });
  };

  const handleSelectAll = (type: 'perks' | 'badges') => {
    if (type === 'perks') {
      onFilterChange({
        ...filters,
        unlockedPerks: true,
        lockedPerks: true,
      });
    } else {
      onFilterChange({
        ...filters,
        unlockedBadges: true,
        lockedBadges: true,
      });
    }
  };

  const handleDeselectAll = (type: 'perks' | 'badges') => {
    if (type === 'perks') {
      onFilterChange({
        ...filters,
        unlockedPerks: false,
        lockedPerks: false,
      });
    } else {
      onFilterChange({
        ...filters,
        unlockedBadges: false,
        lockedBadges: false,
      });
    }
  };

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
        {/* Header with Hide Button and Back Button */}
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
          {/* Unified Status Box (New) */}
          <UnifiedStatusBox />

          {/* Individual Status Boxes (Legacy - can be removed later) */}
          <XPPointsBox />
          <KREXStatusBox />
          <NFTStatusBox />

          {/* Perks Filter Section */}
          <CollapsibleSection
            title="Perks"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2v-2m0 13V5.5A2.5 2.5 0 1019.5 8V19M12 8l-4-4m4 4l4-4" />
              </svg>
            }
            expanded={perksExpanded}
            onToggle={() => setPerksExpanded(!perksExpanded)}
          >
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleSelectAll('perks')}
                  className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleDeselectAll('perks')}
                  className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Deselect All
                </button>
              </div>
              <nav className="space-y-1">
                <label
                  className={`k-sidebar-item group ${filters.unlockedPerks ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.unlockedPerks}
                    onChange={() => handleFilterToggle('unlockedPerks')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.unlockedPerks ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="unlockedPerks" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    Unlocked Perks
                  </span>
                </label>
                <label
                  className={`k-sidebar-item group ${filters.lockedPerks ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.lockedPerks}
                    onChange={() => handleFilterToggle('lockedPerks')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.lockedPerks ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="lockedPerks" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    Locked Perks
                  </span>
                </label>
              </nav>
            </div>
          </CollapsibleSection>

          {/* Badges Filter Section */}
          <CollapsibleSection
            title="Badges"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            expanded={badgesExpanded}
            onToggle={() => setBadgesExpanded(!badgesExpanded)}
          >
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleSelectAll('badges')}
                  className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleDeselectAll('badges')}
                  className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Deselect All
                </button>
              </div>
              <nav className="space-y-1">
                <label
                  className={`k-sidebar-item group ${filters.unlockedBadges ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.unlockedBadges}
                    onChange={() => handleFilterToggle('unlockedBadges')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.unlockedBadges ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="unlockedBadges" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    Unlocked Badges
                  </span>
                </label>
                <label
                  className={`k-sidebar-item group ${filters.lockedBadges ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.lockedBadges}
                    onChange={() => handleFilterToggle('lockedBadges')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.lockedBadges ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="lockedBadges" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    Locked Badges
                  </span>
                </label>
              </nav>
            </div>
          </CollapsibleSection>

          {/* Additional Filters */}
          <CollapsibleSection
            title="Additional"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            expanded={true}
            onToggle={() => { }}
          >
            <div className="mb-4">
              <nav className="space-y-1">
                <label
                  className={`k-sidebar-item group ${filters.nftPerks ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.nftPerks}
                    onChange={() => handleFilterToggle('nftPerks')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.nftPerks ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="nftPerks" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    NFT Perks
                  </span>
                </label>
                <label
                  className={`k-sidebar-item group ${filters.nodePerks ? 'k-sidebar-item-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.nodePerks}
                    onChange={() => handleFilterToggle('nodePerks')}
                    className="sr-only"
                  />
                  <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${filters.nodePerks ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                  <RewardFilterIcon id="nodePerks" />
                  <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate text-left">
                    Node Perks
                  </span>
                </label>
              </nav>
            </div>
          </CollapsibleSection>

          {/* Reset Filters Button */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                onFilterChange({
                  unlockedPerks: true,
                  lockedPerks: true,
                  unlockedBadges: true,
                  lockedBadges: true,
                  nftPerks: true,
                  nodePerks: true,
                });
                setIsOpen(false);
              }}
              className="w-full k-control-btn"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

