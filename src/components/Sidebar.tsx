'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category, categories } from '@/lib/categories';
import type { FilterState, DAppStatus } from '@/lib/dapps';
import { CategoriesIcon, StatusIcon, NetworkIcon } from '@/components/icons/SectionIcons';
import { StatusIndicatorDot, getStatusTypeFromString } from './dapps/StatusIndicatorDot';

interface SidebarProps {
  categories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  filters: Omit<FilterState, 'category'>;
  onStatusChange: (status: DAppStatus[]) => void;
  onDeveloperChange: (developers: string[]) => void;
  onNetworkChange: (networks: string[]) => void;
  counts: Record<string, number>;
  onResetFilters: () => void;
}

const statusOptions: { value: DAppStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Mainnet', label: 'Mainnet' },
  { value: 'Testnet', label: 'Testnet' },
  { value: 'Suspended', label: 'Suspended' },
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
  categories: selectedCategories,
  onCategoryChange,
  filters,
  onStatusChange,
  onDeveloperChange,
  onNetworkChange,
  counts,
  onResetFilters,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  const SectionHeading = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-1">
      {icon && <span className="text-violet-500 dark:text-violet-400 opacity-90">{icon}</span>}
      <span>{title}</span>
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
        <div className="flex flex-col h-full">
          {/* Header: Back link + Hide button */}
          <div className={`flex-shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 ${isHidden ? 'lg:hidden' : ''}`}>
            <Link
              href={pathname.startsWith('/dapps') ? '/' : '/hub'}
              className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              {pathname.startsWith('/dapps') ? 'Back to dApps' : 'Back to Hub'}
            </Link>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Filters - always open, clean menu */}
          <div className={`flex-1 overflow-y-auto p-4 ${isHidden ? 'lg:hidden' : ''}`}>
            {/* Categories */}
            <div className="mb-6">
              <SectionHeading title="Categories" icon={<CategoriesIcon />} />
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => onCategoryChange(categories.map((c) => c.id))} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Select All</button>
                <button type="button" onClick={() => onCategoryChange([])} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Deselect All</button>
              </div>
              <nav className="space-y-0.5">
                {categories.map((category) => {
                  const isChecked = selectedCategories.includes(category.id);
                  const count = counts[category.id] || 0;
                  return (
                    <label key={category.id} className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => { const next = isChecked ? selectedCategories.filter((c) => c !== category.id) : [...selectedCategories, category.id]; onCategoryChange(next); }} className="sr-only" />
                      <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-violet-500 !border-violet-500' : '!bg-zinc-200 dark:!bg-zinc-800'}`} />
                      <CategoryIcon id={category.id} />
                      <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate">{category.name}</span>
                      <span className="k-sidebar-count">{count}</span>
                    </label>
                  );
                })}
              </nav>
            </div>

            {/* Status */}
            <div className="mb-6">
              <SectionHeading title="Status" icon={<StatusIcon />} />
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={handleStatusSelectAll} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Select All</button>
                <button type="button" onClick={handleStatusDeselectAll} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Deselect All</button>
              </div>
              <nav className="space-y-0.5">
                {statusOptions.map((option) => {
                  const currentStatus = filters.status || [];
                  const isChecked = currentStatus.includes(option.value);
                  return (
                    <label key={option.value} className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleStatusToggle(option.value)} className="sr-only" />
                      <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-violet-500 !border-violet-500' : '!bg-zinc-200 dark:!bg-zinc-800'}`} />
                      {option.value !== 'all' && <StatusIndicatorDot statusType={getStatusTypeFromString(option.value)} size="sm" className="flex-shrink-0" />}
                      <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate">{option.label}</span>
                    </label>
                  );
                })}
              </nav>
            </div>

            {/* Network */}
            <div className="mb-6">
              <SectionHeading title="Network" icon={<NetworkIcon />} />
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={handleNetworkSelectAll} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Select All</button>
                <button type="button" onClick={handleNetworkDeselectAll} className="text-[10px] px-2 py-1 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 font-bold uppercase tracking-wider">Deselect All</button>
              </div>
              <nav className="space-y-0.5">
                {networkOptions.map((option) => {
                  const value = option.label === 'All' ? 'all' : option.label;
                  const currentNetwork = filters.network || [];
                  const isChecked = currentNetwork.includes(value);
                  return (
                    <label key={option.label} className={`k-sidebar-item group ${isChecked ? 'k-sidebar-item-active' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleNetworkToggle(option.label)} className="sr-only" />
                      <div className={`control__indicator !static !top-0 !left-0 !transform-none !transition-all ${isChecked ? '!bg-violet-500 !border-violet-500' : '!bg-zinc-200 dark:!bg-zinc-800'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate">{option.label}</span>
                    </label>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
