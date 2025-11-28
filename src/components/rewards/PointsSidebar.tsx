'use client';

import { useState, useRef, useEffect } from 'react';
import { GRIDHoldingsBox } from './GRIDHoldingsBox';
import { XPPointsBox } from './XPPointsBox';
import { KREXStatusBox } from './KREXStatusBox';
import { NFTStatusBox } from './NFTStatusBox';

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

      {/* Hide/Show Button - Fixed position when sidebar is hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(!isHidden)}
          className={`
            hidden lg:flex
            fixed z-[60]
            w-6 h-6 rounded-full
            bg-white dark:bg-zinc-900
            border border-zinc-200 dark:border-zinc-800
            shadow-md
            items-center justify-center
            hover:bg-zinc-100 dark:hover:bg-zinc-800
            transition-all duration-300 ease-in-out
          `}
          style={{
            left: '12px',
            top: '80px',
          }}
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <svg
            className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
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
        {/* Hide/Show Button - Fixed at top of sidebar */}
        {!isHidden && (
          <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex justify-end p-2">
            <button
              onClick={() => setIsHidden(!isHidden)}
              className={`
                hidden lg:flex
                w-6 h-6 rounded-full
                bg-white dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                shadow-md
                items-center justify-center
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                transition-all duration-300 ease-in-out
              `}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <svg
                className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        <div className={`p-4 lg:p-6 ${isHidden ? 'lg:hidden' : ''}`}>
          {/* Rewards Info Boxes */}
          <GRIDHoldingsBox />
          <XPPointsBox />
          <KREXStatusBox />
          <NFTStatusBox />

          {/* Perks Filter Section */}
          <CollapsibleSection
            title="Perks"
            icon={<span className="text-lg">🎁</span>}
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
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.unlockedPerks
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.unlockedPerks}
                    onChange={() => handleFilterToggle('unlockedPerks')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">Unlocked Perks</span>
                </label>
                <label
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.lockedPerks
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.lockedPerks}
                    onChange={() => handleFilterToggle('lockedPerks')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">Locked Perks</span>
                </label>
              </nav>
            </div>
          </CollapsibleSection>

          {/* Badges Filter Section */}
          <CollapsibleSection
            title="Badges"
            icon={<span className="text-lg">🏆</span>}
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
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.unlockedBadges
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.unlockedBadges}
                    onChange={() => handleFilterToggle('unlockedBadges')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">Unlocked Badges</span>
                </label>
                <label
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.lockedBadges
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.lockedBadges}
                    onChange={() => handleFilterToggle('lockedBadges')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">Locked Badges</span>
                </label>
              </nav>
            </div>
          </CollapsibleSection>

          {/* Additional Filters */}
          <CollapsibleSection
            title="Additional"
            icon={<span className="text-lg">⚡</span>}
            expanded={true}
            onToggle={() => {}}
          >
            <div className="mb-4">
              <nav className="space-y-1">
                <label
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.nftPerks
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.nftPerks}
                    onChange={() => handleFilterToggle('nftPerks')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">NFT Perks</span>
                </label>
                <label
                  className={`
                    checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-colors pl-8
                    ${
                      filters.nodePerks
                        ? 'bg-zinc-50 dark:bg-zinc-900/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.nodePerks}
                    onChange={() => handleFilterToggle('nodePerks')}
                  />
                  <div className="control__indicator"></div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">Node Perks</span>
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
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

