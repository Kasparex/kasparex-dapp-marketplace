'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';
import type { ProductFilters } from '@/lib/store/filtering';

interface StoreSidebarProps {
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
  selectedNetwork: ProductNetwork | 'all';
  onNetworkChange: (network: ProductNetwork | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableCategories: ProductCategory[];
  onResetFilters: () => void;
}

export function StoreSidebar({
  selectedCategory,
  onCategoryChange,
  selectedNetwork,
  onNetworkChange,
  searchQuery,
  onSearchChange,
  availableCategories,
  onResetFilters,
}: StoreSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('store-sidebar-hidden');
    if (savedHidden === 'true') setIsHidden(true);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('store-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];
  const networks: ProductNetwork[] = ['L1', 'L2'];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        style={{ width: isHidden ? 0 : '256px', minWidth: isHidden ? 0 : '256px', maxWidth: isHidden ? 0 : '256px' }}
      >
        {/* Header */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/store" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Kasparex Store
            </Link>
            <button
              onClick={() => setIsHidden(true)}
              className="hidden lg:block p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-4">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Category
            </h3>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === 'all'}
                  onChange={() => onCategoryChange('all')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">All</span>
              </label>
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => onCategoryChange(category)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Network Filter */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Network
            </h3>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="network"
                  checked={selectedNetwork === 'all'}
                  onChange={() => onNetworkChange('all')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">All</span>
              </label>
              {networks.map((network) => (
                <label key={network} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="network"
                    checked={selectedNetwork === network}
                    onChange={() => onNetworkChange(network)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{network}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </aside>

      {/* Show Sidebar Button (when hidden) */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="hidden lg:block fixed top-20 left-0 z-30 p-2 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-800 rounded-r-lg shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
