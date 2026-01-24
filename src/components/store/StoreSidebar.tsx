'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

import type { ProductCategory } from '@/lib/store/types';
import { getProductsBySeller } from '@/lib/store/products';

interface StoreSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isWalletConnected?: boolean;
  currentAddress?: string;
  onSubmitProduct?: () => void;
  selectedCategories: ProductCategory[];
  onCategoryChange: (categories: ProductCategory[]) => void;
  categoryCounts: Record<ProductCategory, number>;
  showCategories?: boolean;
  backLink?: {
    href: string;
    label: string;
  };
}

const CATEGORY_EMOJIS: Record<ProductCategory, string> = {
  'Software': '💻',
  'Art': '🎨',
  'Music': '🎵',
  'Templates': '📋',
  'Other': '📦',
};

export function StoreSidebar({
  searchQuery,
  onSearchChange,
  isWalletConnected = false,
  currentAddress,
  onSubmitProduct,
  selectedCategories,
  onCategoryChange,
  categoryCounts,
  showCategories = true,
  backLink = { href: '/hub', label: 'Go back to Hub' },
}: StoreSidebarProps) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [sellerRevenue, setSellerRevenue] = useState<number | null>(null);

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

  const handleCategoryToggle = (category: ProductCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newCategories);
  };
  const [isOpen, setIsOpen] = useState(false);

  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('store-sidebar-hidden');
    const savedWidth = localStorage.getItem('store-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('store-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('store-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Fetch seller revenue
  useEffect(() => {
    async function fetchRevenue() {
      if (!currentAddress) {
        setSellerRevenue(null);
        return;
      }
      try {
        const products = await getProductsBySeller(currentAddress);
        const revenue = products.reduce((acc, product) => {
          return acc + (product.priceKAS * product.purchaseCount);
        }, 0);
        setSellerRevenue(revenue);
      } catch (e) {
        console.error('Failed to fetch seller revenue:', e);
      }
    }
    fetchRevenue();
  }, [currentAddress]);

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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Sidebar Content */}
        <div className="p-4">
          {/* Seller Status - Moved to Top */}
          <div className="space-y-3 mb-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Seller Status
              </h3>
              <div className="mb-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Total Revenue
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {sellerRevenue !== null ? `${sellerRevenue.toLocaleString()} KAS` : '0 KAS'}
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/store/dashboard"
                  className="block w-full px-3 py-2 text-sm font-medium text-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Seller Dashboard
                </Link>
                {/* Submit Product Button - Moved Here */}
                {isWalletConnected && onSubmitProduct && (
                  <button
                    onClick={onSubmitProduct}
                    className="w-full px-3 py-2 text-sm font-medium bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
                  >
                    Submit Product
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filters */}
          {showCategories && (
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-white opacity-80 uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-white hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Categories</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoriesExpanded && (
                <div className="space-y-1 pl-2">
                  {categories.map((category) => {
                    const isChecked = selectedCategories.includes(category);
                    const count = categoryCounts[category] || 0;
                    return (
                      <label
                        key={category}
                        className={`
                          checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg
                          transition-colors pl-8
                          ${isChecked
                            ? 'bg-zinc-50 dark:bg-zinc-900/50'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(category)}
                        />
                        <div className="control__indicator"></div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">{CATEGORY_EMOJIS[category]}</span>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex-shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
