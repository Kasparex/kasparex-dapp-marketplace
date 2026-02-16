'use client';

import Link from 'next/link';
import { GameType, GameDifficulty, GameStatus, gameTypes, difficultyLevels } from '@/lib/games/games';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';

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

function GameIcon({ id, type = 'type', className = '' }: { id: string; type?: 'type' | 'difficulty' | 'status'; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  if (type === 'difficulty') {
    switch (id) {
      case 'easy': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'medium': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'hard': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      case 'expert': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.011 3.419 16.126 7a5.002 5.002 0 011.531 11.657zM11 13a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
      default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    }
  }
  if (type === 'status') {
    switch (id) {
      case 'beta': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.224a2 2 0 01-1.572 0l-.673-.224a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.85 1.15a2 2 0 00.322 2.76l2.36 1.83 2.11 1.63a2 2 0 002.45 0l2.11-1.63 2.36-1.83a2 2 0 00.322-2.76l-.85-1.15z" /></svg>;
      case 'active': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'coming-soon': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'maintenance': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    }
  }
  switch (id) {
    case 'puzzle': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>;
    case 'arcade': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 11-6 0 3 3 0 016 0zm6 5a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 20.9l-6-6M4.5 12.5l5 5" /></svg>;
    case 'strategy': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" /></svg>;
    case 'multiplayer': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'trivia': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'skill': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 11-6 0 3 3 0 016 0zm6 5a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 20.9l-6-6M4.5 12.5l5 5" /></svg>;
  }
}

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
  const handleGameTypeToggle = (type: GameType) => {
    const next = selectedGameTypes.includes(type)
      ? selectedGameTypes.filter((t) => t !== type)
      : [...selectedGameTypes, type];
    onGameTypeChange(next);
  };
  const handleDifficultyToggle = (d: GameDifficulty) => {
    const next = selectedDifficulties.includes(d)
      ? selectedDifficulties.filter((x) => x !== d)
      : [...selectedDifficulties, d];
    onDifficultyChange(next);
  };
  const handleStatusToggle = (s: GameStatus) => {
    const next = selectedStatuses.includes(s)
      ? selectedStatuses.filter((x) => x !== s)
      : [...selectedStatuses, s];
    onStatusChange(next);
  };

  const header = (onHide: () => void) => (
    <div className="flex-shrink-0 bg-transparent border-b border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <Link
          href={backLink.href}
          className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          {backLink.label}
        </Link>
        <button
          type="button"
          onClick={onHide}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Hide sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const gameTypeItems = Object.entries(gameTypes).map(([type, info]) => ({
    id: type,
    label: info.name,
    count: gameTypeCounts[type as GameType] ?? 0,
    icon: <GameIcon id={type} />,
  }));

  const difficultyItems = Object.entries(difficultyLevels).map(([d, info]) => ({
    id: d,
    label: info.name,
    count: difficultyCounts[d as GameDifficulty] ?? 0,
    icon: <GameIcon id={d} type="difficulty" />,
  }));

  const statusItems = (['beta', 'active', 'coming-soon', 'maintenance'] as GameStatus[]).map((status) => ({
    id: status,
    label: status.replace('-', ' '),
    count: statusCounts[status] ?? 0,
    icon: <GameIcon id={status} type="status" />,
  }));

  return (
    <UnifiedSidebar storageKeyPrefix="games" header={header}>
        {showCategories && (
          <>
            <SidebarCategories
              title="Game Type"
              items={gameTypeItems}
              selectedIds={selectedGameTypes}
              onSelect={(id) => handleGameTypeToggle(id as GameType)}
              multi={true}
            />
            <SidebarCategories
              title="Difficulty"
              items={difficultyItems}
              selectedIds={selectedDifficulties}
              onSelect={(id) => handleDifficultyToggle(id as GameDifficulty)}
              multi={true}
            />
            <SidebarCategories
              title="Status"
              items={statusItems}
              selectedIds={selectedStatuses}
              onSelect={(id) => handleStatusToggle(id as GameStatus)}
              multi={true}
            />
            {onCostRangeChange && costRange != null && (
              <SidebarSection title="Entry Cost (KAS)">
                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={costRange.min ?? ''}
                      onChange={(e) => {
                        const min = e.target.value ? parseFloat(e.target.value) : 0;
                        onCostRangeChange({ min, max: costRange.max ?? 10 });
                      }}
                      className="w-full px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="text-zinc-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={costRange.max ?? ''}
                      onChange={(e) => {
                        const max = e.target.value ? parseFloat(e.target.value) : 10;
                        onCostRangeChange({ min: costRange.min ?? 0, max });
                      }}
                      className="w-full px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <button type="button" onClick={() => onCostRangeChange(undefined)} className="w-full text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                    Clear range
                  </button>
                </div>
              </SidebarSection>
            )}
            <button type="button" onClick={onResetFilters} className="w-full mt-4 k-control-btn">
              Reset Filters
            </button>
          </>
        )}
    </UnifiedSidebar>
  );
}
