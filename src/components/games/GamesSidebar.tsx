'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { GameType, GameDifficulty, GameStatus, gameTypes, difficultyLevels } from '@/lib/games/games';

interface GamesSidebarProps {
  selectedGameTypes: GameType[];
  onGameTypeChange: (types: GameType[]) => void;
  selectedDifficulties: GameDifficulty[];
  onDifficultyChange: (difficulties: GameDifficulty[]) => void;
  selectedStatuses: GameStatus[];
  onStatusChange: (statuses: GameStatus[]) => void;
  costRange?: { min: number; max: number };
  onCostRangeChange?: (range: { min: number; max: number } | undefined) => void;
  gameTypeCounts: Record<GameType, number>;
  difficultyCounts: Record<GameDifficulty, number>;
  statusCounts: Record<GameStatus, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  showCategories?: boolean;
  backLink?: { href: string; label: string };
}

const STATUS_EMOJIS: Record<GameStatus, string> = {
  beta: '🧪',
  active: '✅',
  'coming-soon': '⏳',
  maintenance: '🛠️',
};

const DIFFICULTY_EMOJIS: Record<GameDifficulty, string> = {
  easy: '🌱',
  medium: '⚔️',
  hard: '💀',
  expert: '🔥',
};

export function GamesSidebar({
  selectedGameTypes,
  onGameTypeChange,
  selectedDifficulties,
  onDifficultyChange,
  selectedStatuses,
  onStatusChange,
  costRange,
  onCostRangeChange,
  gameTypeCounts,
  difficultyCounts,
  statusCounts,
  searchQuery,
  onSearchChange,
  onResetFilters,
  showCategories = true,
  backLink = { href: '/hub', label: 'Go back to Hub' },
}: GamesSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gameTypesExpanded, setGameTypesExpanded] = useState(true);
  const [difficultiesExpanded, setDifficultiesExpanded] = useState(true);
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [costExpanded, setCostExpanded] = useState(false);

  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('games-sidebar-hidden');
    const savedWidth = localStorage.getItem('games-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('games-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('games-sidebar-width', String(sidebarWidth));
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

  const handleGameTypeToggle = (type: GameType) => {
    const newTypes = selectedGameTypes.includes(type)
      ? selectedGameTypes.filter((t) => t !== type)
      : [...selectedGameTypes, type];
    onGameTypeChange(newTypes);
  };

  const handleDifficultyToggle = (difficulty: GameDifficulty) => {
    const newDifficulties = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];
    onDifficultyChange(newDifficulties);
  };

  const handleStatusToggle = (status: GameStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newStatuses);
  };

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
          {icon && <span className="text-zinc-700 dark:text-white opacity-80">{icon}</span>}
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
        style={{ top: '5.5rem' }}
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6 text-zinc-900 dark:text-zinc-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        {/* Header with Hide Button and Search */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={backLink.href}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLink.label}
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
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100 mb-3"
          />
        </div>

        {/* Sidebar Content */}
        <div className="p-4">
          {showCategories && (
            <>
              {/* Game Types Filter */}
              <CollapsibleSection
                title="Game Type"
                icon="🎮"
                expanded={gameTypesExpanded}
                onToggle={() => setGameTypesExpanded(!gameTypesExpanded)}
              >
                <div className="space-y-1 pl-2">
                  {Object.entries(gameTypes).map(([type, info]) => {
                    const isChecked = selectedGameTypes.includes(type as GameType);
                    const count = gameTypeCounts[type as GameType] || 0;
                    return (
                      <label
                        key={type}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleGameTypeToggle(type as GameType)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        <span className="k-sidebar-emoji">{info.emoji}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{info.name}</span>
                        <span className="k-sidebar-count">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Difficulty Filter */}
              <CollapsibleSection
                title="Difficulty"
                icon="⚡"
                expanded={difficultiesExpanded}
                onToggle={() => setDifficultiesExpanded(!difficultiesExpanded)}
              >
                <div className="space-y-1 pl-2">
                  {Object.entries(difficultyLevels).map(([difficulty, info]) => {
                    const isChecked = selectedDifficulties.includes(difficulty as GameDifficulty);
                    const count = difficultyCounts[difficulty as GameDifficulty] || 0;
                    return (
                      <label
                        key={difficulty}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDifficultyToggle(difficulty as GameDifficulty)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        <span className="k-sidebar-emoji">{DIFFICULTY_EMOJIS[difficulty as GameDifficulty]}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{info.name}</span>
                        <span className="k-sidebar-count">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Status Filter */}
              <CollapsibleSection
                title="Status"
                icon="📊"
                expanded={statusExpanded}
                onToggle={() => setStatusExpanded(!statusExpanded)}
              >
                <div className="space-y-1 pl-2">
                  {(['beta', 'active', 'coming-soon', 'maintenance'] as GameStatus[]).map((status) => {
                    const isChecked = selectedStatuses.includes(status);
                    const count = statusCounts[status] || 0;
                    return (
                      <label
                        key={status}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStatusToggle(status)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        <span className="k-sidebar-emoji">{STATUS_EMOJIS[status]}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{status.replace('-', ' ')}</span>
                        <span className="k-sidebar-count">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Cost Range Filter */}
              {onCostRangeChange && (
                <CollapsibleSection
                  title="Entry Cost (KAS)"
                  icon="💰"
                  expanded={costExpanded}
                  onToggle={() => setCostExpanded(!costExpanded)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={costRange?.min || ''}
                        onChange={(e) => {
                          const min = e.target.value ? parseFloat(e.target.value) : 0;
                          onCostRangeChange({ min, max: costRange?.max || 10 });
                        }}
                        className="w-full px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-zinc-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={costRange?.max || ''}
                        onChange={(e) => {
                          const max = e.target.value ? parseFloat(e.target.value) : 10;
                          onCostRangeChange({ min: costRange?.min || 0, max });
                        }}
                        className="w-full px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    {costRange && (
                      <button
                        onClick={() => onCostRangeChange(undefined)}
                        className="w-full text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Clear range
                      </button>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Reset Filters Button */}
              <button
                onClick={onResetFilters}
                className="w-full mt-4 px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
