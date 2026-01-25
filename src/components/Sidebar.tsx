'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Category, categories } from '@/lib/categories';
import type { FilterState, DAppStatus } from '@/lib/dapps';
import { CategoriesIcon, StatusIcon, DeveloperIcon, NetworkIcon } from '@/components/icons/SectionIcons';
import { StatusIndicatorDot, getStatusTypeFromString } from './dapps/StatusIndicatorDot';
import { GRIDHoldingsBox } from './rewards/GRIDHoldingsBox';
import { XPPointsBox } from './rewards/XPPointsBox';
import { UnifiedStatusBox } from './rewards/UnifiedStatusBox';
import { QuickGuideWizard } from './rewards/QuickGuideWizard';

interface SidebarProps {
  categories: Category[]; // Renamed from selectedCategories
  onCategoryChange: (categories: Category[]) => void;
  filters: Omit<FilterState, 'category'>;
  onStatusChange: (status: DAppStatus[]) => void; // New prop
  onDeveloperChange: (developers: string[]) => void; // New prop
  onNetworkChange: (networks: string[]) => void; // New prop
  counts: Record<string, number>; // Renamed from categoryCounts, type changed to string
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
}

const statusOptions: { value: DAppStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Mainnet', label: 'Mainnet' },
  { value: 'Testnet', label: 'Testnet' },
  { value: 'Suspended', label: 'Suspended' },
];

const developerOptions: { label: string; logo?: string }[] = [
  { label: 'All' },
  { label: 'Kasparex', logo: '/img/logos/kasparex.png' },
  { label: 'KaspaCom', logo: '/img/logos/kaspacom.png' },
  { label: 'KasTools', logo: '/img/logos/kastools.png' },
  { label: 'Kasplex', logo: '/img/logos/kasplex.png' },
];

const networkOptions: { label: string; logo?: string }[] = [
  { label: 'All' },
  { label: 'Kasplex L2 Mainnet', logo: '/img/logos/kasplex.png' },
  { label: 'Kasplex L2 Testnet', logo: '/img/logos/kasplex.png' },
  { label: 'Igra Caravel Testnet', logo: '/img/logos/igra.png' },
  { label: 'vProgs', logo: '/img/logos/kaspa.png' },
];

function CategoryIcon({ id, className = "" }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  switch (id) {
    case 'all': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'tracker': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'general': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'minting': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'defi': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'games': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 11-6 0 3 3 0 016 0zm6 5a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 20.9l-6-6M4.5 12.5l5 5" /></svg>;
    case 'promotion': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A1.76 1.76 0 015 15.066V15c0 .115.022.23.064.338a.98.98 0 00.936.662H9c.552 0 1 .448 1 1s-.448 1-1 1H7.618a2 2 0 01-1.789-1.106l-.53-.1.53.1zm14.11-6.191A1.76 1.76 0 0021 6.096V6c0-.115-.022-.23-.064-.338a.98.98 0 00-.936-.662H15c-.552 0-1-.448-1-1s.448-1 1-1h1.382a2 2 0 001.789-1.106l.53.1-.53-.1z" /></svg>;
    case 'subscription': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    case 'dao': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'tools': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'collabs': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'airdrops': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>;
    case 'payment': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  }
}

export function Sidebar({
  categories: selectedCategories, // Destructure `categories` prop as `selectedCategories`
  onCategoryChange,
  filters,
  onStatusChange, // New prop
  onDeveloperChange, // New prop
  onNetworkChange, // New prop
  counts, // Renamed from categoryCounts
  searchQuery,
  onSearchChange,
  onResetFilters,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [developerExpanded, setDeveloperExpanded] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('sidebar-hidden');
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('sidebar-width', String(sidebarWidth));
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

  const handleStatusToggle = (status: DAppStatus | 'all') => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    onStatusChange(newStatus.filter((s): s is DAppStatus => s !== 'all')); // Filter out 'all' before passing
  };

  const handleStatusSelectAll = () => {
    const allStatuses = statusOptions
      .map(opt => opt.value)
      .filter((v): v is DAppStatus => v !== 'all');
    onStatusChange(allStatuses);
  };

  const handleStatusDeselectAll = () => {
    onStatusChange([]);
  };

  const handleDeveloperToggle = (developer: string) => {
    const value = developer === 'All' ? 'all' : developer;
    const currentDeveloper = filters.developer || [];
    const newDeveloper = currentDeveloper.includes(value)
      ? currentDeveloper.filter((d) => d !== value)
      : [...currentDeveloper, value];
    onDeveloperChange(newDeveloper.filter((d): d is string => d !== 'all')); // Filter out 'all'
  };

  const handleDeveloperSelectAll = () => {
    const allDevelopers = developerOptions.filter(opt => opt.label !== 'All').map((opt) => opt.label);
    onDeveloperChange(allDevelopers);
  };

  const handleDeveloperDeselectAll = () => {
    onDeveloperChange([]);
  };

  const handleNetworkToggle = (network: string) => {
    const value = network === 'All' ? 'all' : network;
    const currentNetwork = filters.network || [];
    const newNetwork = currentNetwork.includes(value)
      ? currentNetwork.filter((n) => n !== value)
      : [...currentNetwork, value];
    onNetworkChange(newNetwork.filter((n): n is string => n !== 'all')); // Filter out 'all'
  };

  const handleNetworkSelectAll = () => {
    const allNetworks = networkOptions.filter(opt => opt.label !== 'All').map((opt) => opt.label);
    onNetworkChange(allNetworks);
  };

  const handleNetworkDeselectAll = () => {
    onNetworkChange([]);
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
    className = '',
  }: {
    title: string;
    icon?: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className || "mb-4"}>
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
        {/* Header with Hide Button and Back Link */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Hub
            </Link>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className={`p-4 ${isHidden ? 'lg:hidden' : ''}`}>
          {/* Collapsible Filters Group */}
          <CollapsibleSection
            title="Filters"
            expanded={filtersExpanded}
            onToggle={() => setFiltersExpanded(!filtersExpanded)}
            className={filtersExpanded ? "mb-6" : "mb-4"}
          >
            {/* Categories Filter */}
            <CollapsibleSection
              title="Categories"
              icon={<CategoriesIcon />}
              expanded={categoriesExpanded}
              onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
            >
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      const allCategories = categories.map((cat) => cat.id);
                      onCategoryChange(allCategories);
                    }}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      onCategoryChange([]);
                    }}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Deselect All
                  </button>
                </div>
                <nav className="space-y-1">
                  {categories.map((category) => {
                    const isChecked = selectedCategories.includes(category.id);
                    const count = counts[category.id] || 0;
                    return (
                      <label
                        key={category.id}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newCategories = isChecked
                              ? selectedCategories.filter((c) => c !== category.id)
                              : [...selectedCategories, category.id];
                            onCategoryChange(newCategories);
                          }}
                          className="sr-only" // Hide native checkbox for premium look
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        <CategoryIcon id={category.id} />
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{category.name}</span>
                        <span className="k-sidebar-count">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </nav>
              </div>
            </CollapsibleSection>

            {/* Status Filter */}
            <CollapsibleSection
              title="Status"
              icon={<StatusIcon />}
              expanded={statusExpanded}
              onToggle={() => setStatusExpanded(!statusExpanded)}
            >
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleStatusSelectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleStatusDeselectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Deselect All
                  </button>
                </div>
                <nav className="space-y-1">
                  {statusOptions.map((option) => {
                    const currentStatus = filters.status || [];
                    const isChecked = currentStatus.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStatusToggle(option.value)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        {option.value !== 'all' && (
                          <StatusIndicatorDot
                            statusType={getStatusTypeFromString(option.value)}
                            size="sm"
                            className="flex-shrink-0"
                          />
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{option.label}</span>
                      </label>
                    );
                  })}
                </nav>
              </div>
            </CollapsibleSection>

            {/* Developer Filter */}
            <CollapsibleSection
              title="Developer"
              icon={<DeveloperIcon />}
              expanded={developerExpanded}
              onToggle={() => setDeveloperExpanded(!developerExpanded)}
            >
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleDeveloperSelectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeveloperDeselectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Deselect All
                  </button>
                </div>
                <nav className="space-y-1">
                  {developerOptions.map((option) => {
                    const value = option.label === 'All' ? 'all' : option.label;
                    const currentDeveloper = filters.developer || [];
                    const isChecked = currentDeveloper.includes(value);
                    return (
                      <label
                        key={option.label}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDeveloperToggle(option.label)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        {option.logo && (
                          <Image
                            src={option.logo}
                            alt={`${option.label} logo`}
                            width={16}
                            height={16}
                            className="flex-shrink-0 grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{option.label}</span>
                      </label>
                    );
                  })}
                </nav>
              </div>
            </CollapsibleSection>

            {/* Network Filter */}
            <CollapsibleSection
              title="Network"
              icon={<NetworkIcon />}
              expanded={networkExpanded}
              onToggle={() => setNetworkExpanded(!networkExpanded)}
            >
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleNetworkSelectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleNetworkDeselectAll}
                    className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Deselect All
                  </button>
                </div>
                <nav className="space-y-1">
                  {networkOptions.map((option) => {
                    const value = option.label === 'All' ? 'all' : option.label;
                    const currentNetwork = filters.network || [];
                    const isChecked = currentNetwork.includes(value);
                    return (
                      <label
                        key={option.label}
                        className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleNetworkToggle(option.label)}
                          className="sr-only"
                        />
                        <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-[#02abb8] !border-[#02abb8]' : '!bg-zinc-200 dark:!bg-zinc-800'}`}></div>
                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors flex-1 truncate">{option.label}</span>
                      </label>
                    );
                  })}
                </nav>
              </div>
            </CollapsibleSection>
          </CollapsibleSection>

          {/* Quick Guide Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowQuickGuide(true)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Quick Guide
            </button>
          </div>

          {/* Unified Status Box (New) */}
          <UnifiedStatusBox />

          {/* Individual Status Boxes (Legacy - can be removed later) */}
          <GRIDHoldingsBox />
          <XPPointsBox />


        </div>
      </aside>

      {/* Quick Guide Wizard */}
      <QuickGuideWizard
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
      />
    </>
  );
}
