'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { categories, type Category } from '@/lib/categories';
import type { FilterState, DAppStatus } from '@/lib/dapps';
import { CategoriesIcon, StatusIcon, DeveloperIcon, NetworkIcon } from '@/components/icons/SectionIcons';
import { StatusIndicatorDot, getStatusTypeFromString } from './dapps/StatusIndicatorDot';
import { GRIDHoldingsBox } from './rewards/GRIDHoldingsBox';
import { XPPointsBox } from './rewards/XPPointsBox';
import { KREXStatusBox } from './rewards/KREXStatusBox';
import { NFTStatusBox } from './rewards/NFTStatusBox';
import { QuickGuideWizard } from './rewards/QuickGuideWizard';

interface SidebarProps {
  selectedCategories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  filters: Omit<FilterState, 'category'>;
  onFilterChange: (filters: Omit<FilterState, 'category'>) => void;
  categoryCounts: Record<Category, number>;
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

export function Sidebar({
  selectedCategories,
  onCategoryChange,
  filters,
  onFilterChange,
  categoryCounts,
  searchQuery,
  onSearchChange,
  onResetFilters,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
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
    onFilterChange({ ...filters, status: newStatus });
  };

  const handleStatusSelectAll = () => {
    const allStatuses = statusOptions.map((opt) => opt.value);
    onFilterChange({ ...filters, status: allStatuses });
  };

  const handleStatusDeselectAll = () => {
    onFilterChange({ ...filters, status: [] });
  };

  const handleDeveloperToggle = (developer: string) => {
    const value = developer === 'All' ? 'all' : developer;
    const currentDeveloper = filters.developer || [];
    const newDeveloper = currentDeveloper.includes(value)
      ? currentDeveloper.filter((d) => d !== value)
      : [...currentDeveloper, value];
    onFilterChange({ ...filters, developer: newDeveloper });
  };

  const handleDeveloperSelectAll = () => {
    const allDevelopers = developerOptions.map((opt) => (opt.label === 'All' ? 'all' : opt.label));
    onFilterChange({ ...filters, developer: allDevelopers });
  };

  const handleDeveloperDeselectAll = () => {
    onFilterChange({ ...filters, developer: [] });
  };

  const handleNetworkToggle = (network: string) => {
    const value = network === 'All' ? 'all' : network;
    const currentNetwork = filters.network || [];
    const newNetwork = currentNetwork.includes(value)
      ? currentNetwork.filter((n) => n !== value)
      : [...currentNetwork, value];
    onFilterChange({ ...filters, network: newNetwork });
  };

  const handleNetworkSelectAll = () => {
    const allNetworks = networkOptions.map((opt) => (opt.label === 'All' ? 'all' : opt.label));
    onFilterChange({ ...filters, network: allNetworks });
  };

  const handleNetworkDeselectAll = () => {
    onFilterChange({ ...filters, network: [] });
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

      {/* Hide/Show Button - Sticky at top-right corner (always visible) */}
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
          left: isHidden ? '12px' : `${sidebarWidth - 18}px`,
          top: '16px',
        }}
        title={isHidden ? 'Show sidebar' : 'Hide sidebar'}
        aria-label={isHidden ? 'Show sidebar' : 'Hide sidebar'}
      >
        <svg
          className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isHidden ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
        </svg>
      </button>

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
        {/* Sticky Header with Search Box and Hide Button */}
        <div className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search dApps..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            {/* Hide Button */}
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
                flex-shrink-0
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
        </div>

        {/* Sidebar Content */}
        <div className={`p-4 lg:p-6 ${isHidden ? 'lg:hidden' : ''}`}>

          {/* Quick Guide Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowQuickGuide(true)}
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Guide
            </button>
          </div>

          {/* Rewards Info Boxes */}
          <KREXStatusBox />
          <NFTStatusBox />
          <GRIDHoldingsBox />
          <XPPointsBox />

          {/* Categories Section */}
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
                  const count = categoryCounts[category.id] || 0;
                  return (
                    <label
                      key={category.id}
                      className={`
                        checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                        transition-colors pl-8
                        ${
                          isChecked
                            ? 'bg-zinc-50 dark:bg-zinc-900/50'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                        }
                      `}
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
                      />
                      <div className="control__indicator"></div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{category.emoji}</span>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{category.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex-shrink-0">
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
                      className={`
                        checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                        transition-colors pl-8
                        ${
                          isChecked
                            ? 'bg-zinc-50 dark:bg-zinc-900/50'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleStatusToggle(option.value)}
                      />
                      <div className="control__indicator"></div>
                      {option.value !== 'all' && (
                        <StatusIndicatorDot
                          statusType={getStatusTypeFromString(option.value)}
                          size="sm"
                          className="flex-shrink-0"
                        />
                      )}
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{option.label}</span>
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
                      className={`
                        checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                        transition-colors pl-8
                        ${
                          isChecked
                            ? 'bg-zinc-50 dark:bg-zinc-900/50'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDeveloperToggle(option.label)}
                      />
                      <div className="control__indicator"></div>
                      {option.logo ? (
                        <>
                          <Image
                            src={option.logo}
                            alt={`${option.label} logo`}
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                            onError={(e) => {
                              // Hide logo if it doesn't exist
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{option.label}</span>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{option.label}</span>
                      )}
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
                      className={`
                        checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                        transition-colors pl-8
                        ${
                          isChecked
                            ? 'bg-zinc-50 dark:bg-zinc-900/50'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleNetworkToggle(option.label)}
                      />
                      <div className="control__indicator"></div>
                      {option.logo ? (
                        <>
                          <Image
                            src={option.logo}
                            alt={`${option.label} logo`}
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                            onError={(e) => {
                              // Hide logo if it doesn't exist
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{option.label}</span>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{option.label}</span>
                      )}
                    </label>
                  );
                })}
              </nav>
            </div>
          </CollapsibleSection>

          {/* Build dApp Button */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/build-dapp"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Build dApp
            </Link>
          </div>

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
