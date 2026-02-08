'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ProductCategory, Product, Purchase } from '@/lib/store/types';

interface StoreSidebarProps {
  mode: 'listing' | 'product' | 'dashboard';
  // Listing props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categories?: ProductCategory[];
  selectedCategories?: ProductCategory[];
  onCategoryChange?: (categories: ProductCategory[]) => void;
  categoryCounts?: Record<ProductCategory, number>;
  // Product props
  currentProduct?: Product;
  // Dashboard props
  sellerRevenue?: number;
  totalSales?: number;
}

function StoreCategoryIcon({ id, className = "" }: { id: string; className?: string }) {
  const iconProps = { className: `w-4 h-4 ${className}`, strokeWidth: 2, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  switch (id.toLowerCase()) {
    case 'software': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'art': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
    case 'music': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    case 'templates': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  }
}

export function StoreSidebar({
  mode,
  searchQuery = '',
  onSearchChange,
  categories = ['Software', 'Art', 'Music', 'Templates', 'Other'],
  selectedCategories = [],
  onCategoryChange,
  categoryCounts = { Software: 0, Art: 0, Music: 0, Templates: 0, Other: 0 },
  currentProduct,
  sellerRevenue = 0,
  totalSales = 0,
}: StoreSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Expand states
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [productDetailsExpanded, setProductDetailsExpanded] = useState(true);
  const [dashboardMenuExpanded, setDashboardMenuExpanded] = useState(true);

  // Load sidebar state
  useEffect(() => {
    const savedHidden = localStorage.getItem('store-sidebar-hidden');
    const savedWidth = localStorage.getItem('store-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('store-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('store-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Resize handlers
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

  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
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
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 px-2 hover:text-violet-500 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">{icon}</span>}
          <span>{title}</span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && <div className="space-y-1">{children}</div>}
    </div>
  );

  const isListing = mode === 'listing';
  const isProduct = mode === 'product';
  const isDashboard = mode === 'dashboard';

  const handleCategoryToggle = (cat: ProductCategory) => {
    if (!onCategoryChange || !selectedCategories) return;
    const newCats = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCats);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
        style={{ top: '5.5rem' }}
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Show Sidebar Button */}
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

      <aside
        ref={sidebarRef}
        className={`
                    fixed lg:sticky top-16 lg:top-0 left-0 z-40
                    h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
                    bg-white dark:bg-zinc-950
                    border-r border-zinc-200 dark:border-zinc-800
                    transform transition-all duration-300 ease-in-out
                    flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isHidden ? 'lg:translate-x-[-100%]' : ''}
                `}
        style={{
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
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
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Header with Back Link and Hide Button */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
            <Link
              href={isListing ? '/hub' : '/store'}
              className="text-zinc-500 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              {isListing ? 'Back to Hub' : 'Back to Store'}
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

          <div className="flex-1 p-4">
            {/* LISTING MODE: Status & Quick Actions */}
            {isListing && (
              <div className="mb-8">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/store/dashboard"
                    className="k-sidebar-item group"
                  >
                    <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">My Dashboard</span>
                  </Link>
                  <Link
                    href="/store/create"
                    className="k-sidebar-item group"
                  >
                    <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">+ Add Product</span>
                  </Link>
                  <Link
                    href="/store/dashboard?tab=purchased"
                    className="k-sidebar-item group"
                  >
                    <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">My Purchases</span>
                  </Link>
                </div>
              </div>
            )}

            {/* LISTING MODE: Categories */}
            {isListing && (
              <CollapsibleSection
                title="Categories"
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                expanded={categoriesExpanded}
                onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
              >
                {categories?.map((cat) => {
                  const isSelected = selectedCategories?.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`w-full k-sidebar-item group ${isSelected ? 'k-sidebar-item-active' : ''}`}
                    >
                      <StoreCategoryIcon id={cat} className="mr-2 opacity-70 group-hover:text-[#02abb8]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider transition-colors truncate">
                        {cat}
                      </span>
                      {categoryCounts && (
                        <span className="ml-auto text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                          {categoryCounts[cat] || 0}
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#02abb8] rounded-r-full shadow-[0_0_10px_#02abb8]" />
                      )}
                    </button>
                  );
                })}
              </CollapsibleSection>
            )}

            {/* DASHBOARD MODE: Menu */}
            {isDashboard && (
              <CollapsibleSection
                title="Seller Panel"
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                expanded={dashboardMenuExpanded}
                onToggle={() => setDashboardMenuExpanded(!dashboardMenuExpanded)}
              >
                <div className="px-2 py-4 mb-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Total Revenue</div>
                  <div className="text-2xl font-black text-[#02abb8]">{sellerRevenue.toLocaleString()} KAS</div>
                </div>

                <Link href="/store/dashboard" className={`w-full k-sidebar-item group ${pathname === '/store/dashboard' ? 'k-sidebar-item-active' : ''}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate">Overview</span>
                </Link>
                <Link href="/store/dashboard?tab=products" className="w-full k-sidebar-item group">
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate">My Products</span>
                </Link>
                <Link href="/store/dashboard?tab=sales" className="w-full k-sidebar-item group">
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate">Sales History</span>
                </Link>
              </CollapsibleSection>
            )}

            {/* PRODUCT MODE: Info */}
            {isProduct && currentProduct && (
              <CollapsibleSection
                title="Product Details"
                expanded={productDetailsExpanded}
                onToggle={() => setProductDetailsExpanded(!productDetailsExpanded)}
              >
                <div className="px-3 py-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">{currentProduct.title}</h4>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Price</div>
                      <div className="text-lg font-black text-violet-500">{currentProduct.priceKAS} KAS</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Category</div>
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-bold">
                        <StoreCategoryIcon id={currentProduct.category} />
                        {currentProduct.category}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Network</div>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${currentProduct.network === 'L1'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                        {currentProduct.network} Network
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">
                KS
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">
                  Kasparex Store
                </p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase">Digital Marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(161, 161, 170, 0.2);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(63, 63, 70, 0.4);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.4);
                }
            `}</style>
    </>
  );
}
