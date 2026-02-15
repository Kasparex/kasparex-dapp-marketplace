'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ProductCategory, Product } from '@/lib/store/types';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarQuickActions } from '../sidebar/SidebarQuickActions';
import { SidebarCategories } from '../sidebar/SidebarCategories';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

interface StoreSidebarProps {
  mode: 'listing' | 'product' | 'dashboard';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categories?: ProductCategory[];
  selectedCategories?: ProductCategory[];
  onCategoryChange?: (categories: ProductCategory[]) => void;
  categoryCounts?: Record<ProductCategory, number>;
  currentProduct?: Product;
  sellerRevenue?: number;
  totalSales?: number;
}

function StoreCategoryIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `w-4 h-4 ${className}`, strokeWidth: 2, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' };
  switch (id.toLowerCase()) {
    case 'software': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'art': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
    case 'music': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    case 'templates': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  }
}

const defaultCategories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

const quickActionsListing = [
  { id: 'dashboard', label: 'My Dashboard', href: '/store/dashboard', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { id: 'create', label: 'Add New', href: '/store/create', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
  { id: 'purchased', label: 'My Purchases', href: '/store/dashboard?tab=purchased', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
];

export function StoreSidebar({
  mode,
  categories = defaultCategories,
  selectedCategories = [],
  onCategoryChange,
  categoryCounts = { Software: 0, Art: 0, Music: 0, Templates: 0, Other: 0 },
  currentProduct,
  sellerRevenue = 0,
  totalSales = 0,
}: StoreSidebarProps) {
  const pathname = usePathname();
  const isListing = mode === 'listing';
  const isProduct = mode === 'product';
  const isDashboard = mode === 'dashboard';

  const backHref = isListing ? '/hub' : '/store';
  const backLabel = isListing ? 'Back to Hub' : 'Back to Store';

  const handleCategoryToggle = (id: string) => {
    if (!onCategoryChange) return;
    const cat = id as ProductCategory;
    const newCats = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCats);
  };

  const categoryItems = categories?.map((cat) => ({
    id: cat,
    label: cat,
    count: categoryCounts?.[cat] ?? 0,
    icon: <StoreCategoryIcon id={cat} className="opacity-70 group-hover:text-[#02abb8]" />,
  })) ?? [];

  const storeFooter = (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">KS</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">Kasparex Store</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase">Digital Marketplace</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="store"
      header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} className="bg-white dark:bg-zinc-950" />}
      footer={storeFooter}
    >
      {isListing && (
        <>
          <SidebarQuickActions items={quickActionsListing} sectionIcon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
          <SidebarSection title="Categories" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}>
            <SidebarCategories
              items={categoryItems}
              selectedIds={selectedCategories}
              onSelect={handleCategoryToggle}
              multi={true}
            />
          </SidebarSection>
        </>
      )}

      {isDashboard && (
        <SidebarSection title="Seller Panel" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
          <div className="px-2 py-4 mb-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Total Revenue</div>
            <div className="text-2xl font-black text-[#02abb8]">{sellerRevenue.toLocaleString()} KAS</div>
          </div>
          <nav className="space-y-0.5">
            <SidebarNavItem href="/store/dashboard" label="Overview" active={pathname === '/store/dashboard'} />
            <SidebarNavItem href="/store/dashboard?tab=products" label="My Products" />
            <SidebarNavItem href="/store/dashboard?tab=sales" label="Sales History" />
          </nav>
        </SidebarSection>
      )}

      {isProduct && currentProduct && (
        <SidebarSection title="Product Details">
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
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${currentProduct.network === 'L1' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                  {currentProduct.network} Network
                </div>
              </div>
            </div>
          </div>
        </SidebarSection>
      )}
    </UnifiedSidebar>
  );
}
