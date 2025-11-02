'use client';

import { useState } from 'react';
import { categories, type Category } from '@/lib/categories';
import type { FilterState, DAppStatus } from '@/lib/dapps';

interface SidebarProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  filters: Omit<FilterState, 'category'>;
  onFilterChange: (filters: Omit<FilterState, 'category'>) => void;
  categoryCounts: Record<Category, number>;
}

const statusOptions: { value: DAppStatus | 'all'; emoji: string; label: string }[] = [
  { value: 'all', emoji: '', label: 'All' },
  { value: 'Concept', emoji: '⚪', label: 'Concept' },
  { value: 'Prototype', emoji: '🟠', label: 'Prototype' },
  { value: 'Testnet', emoji: '🟡', label: 'Testnet' },
  { value: 'Mainnet', emoji: '🟢', label: 'Mainnet' },
  { value: 'Devnet', emoji: '🟣', label: 'Devnet' },
  { value: 'U/C', emoji: '🔵', label: 'U/C' },
  { value: 'Suspended', emoji: '🔴', label: 'Suspended' },
];

const developerOptions = [
  'All',
  'Kasparex',
  'KaspaCom',
  'KasFyi',
  'KasTools',
  'Kasplex',
];

const networkOptions = [
  'All',
  'KRC-20',
  'Kasplex L2',
  'Igra L2',
  'Other',
];

export function Sidebar({
  selectedCategory,
  onCategoryChange,
  filters,
  onFilterChange,
  categoryCounts,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [developerExpanded, setDeveloperExpanded] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(false);

  const handleStatusChange = (status: DAppStatus | 'all') => {
    onFilterChange({ ...filters, status });
    setIsOpen(false);
  };

  const handleDeveloperChange = (developer: string) => {
    onFilterChange({ ...filters, developer: developer === 'All' ? 'all' : developer });
    setIsOpen(false);
  };

  const handleNetworkChange = (network: string) => {
    onFilterChange({ ...filters, network: network === 'All' ? 'all' : network });
    setIsOpen(false);
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
    expanded,
    onToggle,
    children,
  }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <span>{title}</span>
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
          {/* Categories Section */}
          <CollapsibleSection
            title="Categories"
            expanded={categoriesExpanded}
            onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
          >
            <nav className="space-y-1 mb-4">
              {categories.map((category) => {
                const isActive = selectedCategory === category.id;
                const count = categoryCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      onCategoryChange(category.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg
                      transition-colors
                      flex items-center justify-between
                      ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-medium'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded
                        ${
                          isActive
                            ? 'bg-zinc-700 dark:bg-zinc-600 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </CollapsibleSection>

          {/* Status Filter */}
          <CollapsibleSection
            title="Status"
            expanded={statusExpanded}
            onToggle={() => setStatusExpanded(!statusExpanded)}
          >
            <nav className="space-y-1 mb-4">
              {statusOptions.map((option) => {
                const isActive = filters.status === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg
                      transition-colors
                      flex items-center gap-2
                      ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-medium'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }
                    `}
                  >
                    {option.emoji && <span className="text-lg">{option.emoji}</span>}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </nav>
          </CollapsibleSection>

          {/* Developer Filter */}
          <CollapsibleSection
            title="Developer"
            expanded={developerExpanded}
            onToggle={() => setDeveloperExpanded(!developerExpanded)}
          >
            <nav className="space-y-1 mb-4">
              {developerOptions.map((option) => {
                const value = option === 'All' ? 'all' : option;
                const isActive = filters.developer === value;
                return (
                  <button
                    key={option}
                    onClick={() => handleDeveloperChange(option)}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg
                      transition-colors
                      ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-medium'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </nav>
          </CollapsibleSection>

          {/* Network Filter */}
          <CollapsibleSection
            title="Network"
            expanded={networkExpanded}
            onToggle={() => setNetworkExpanded(!networkExpanded)}
          >
            <nav className="space-y-1 mb-4">
              {networkOptions.map((option) => {
                const value = option === 'All' ? 'all' : option;
                const isActive = filters.network === value;
                return (
                  <button
                    key={option}
                    onClick={() => handleNetworkChange(option)}
                    className={`
                      w-full text-left px-4 py-2 rounded-lg
                      transition-colors
                      ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-medium'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </nav>
          </CollapsibleSection>
        </div>
      </aside>
    </>
  );
}
