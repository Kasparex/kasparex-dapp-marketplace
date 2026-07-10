'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { StoreSellerTab } from '@/lib/store/sellerTabs';
import { storeSellerTabHref } from '@/lib/store/sellerTabs';
import type { ProductCategory, Product } from '@/lib/store/types';
import {
  STORE_PRODUCT_TABS,
  type StoreProductContentTab,
} from '@/lib/store/productPageSections';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarCategories } from '../sidebar/SidebarCategories';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';
import { HUB_SIDEBAR_BTN_ICON, HUB_SIDEBAR_BTN_ICON_ACTIVE } from '@/lib/hub/hubLayout';

export interface StoreSidebarProps {
  mode: 'listing' | 'product' | 'dashboard';
  categories?: ProductCategory[];
  selectedCategories?: ProductCategory[];
  onCategoryChange?: (categories: ProductCategory[]) => void;
  categoryCounts?: Record<ProductCategory, number>;
  currentProduct?: Product;
  sellerTab?: StoreSellerTab;
  onSellerTabChange?: (tab: StoreSellerTab) => void;
  productContentTab?: StoreProductContentTab;
  onProductTabChange?: (tab: StoreProductContentTab) => void;
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

const SELLER_TAB_ITEMS: { id: StoreSellerTab; label: string; icon: ReactNode }[] = [
  {
    id: 'purchased',
    label: 'My Purchases',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'My Products',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'List Product',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
];

const productSectionIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
  </svg>
);

function StoreListingQuickLinksFallback() {
  return (
    <div className="mb-6 space-y-2">
      <div className="k-control-btn w-full justify-center gap-2 opacity-60">Seller Dashboard</div>
      <div className="k-control-btn w-full justify-center gap-2 opacity-60">List Product</div>
    </div>
  );
}

function StoreListingQuickLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboardActive = pathname.startsWith('/store/dashboard');
  const createActive = dashboardActive && searchParams.get('tab') === 'create';
  const dashboardDefaultActive = dashboardActive && searchParams.get('tab') !== 'create';

  return (
    <div className="mb-6 space-y-2">
      <Link
        href="/store/dashboard"
        className={`k-control-btn w-full justify-center gap-2 ${dashboardDefaultActive ? '!bg-cyan-600 !text-white' : ''}`}
      >
        <svg className={dashboardDefaultActive ? HUB_SIDEBAR_BTN_ICON_ACTIVE : HUB_SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Seller Dashboard
      </Link>
      <Link
        href="/store/dashboard?tab=create"
        className={`k-control-btn w-full justify-center gap-2 ${createActive ? '!bg-cyan-600 !text-white' : ''}`}
      >
        <svg className={createActive ? HUB_SIDEBAR_BTN_ICON_ACTIVE : HUB_SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        List Product
      </Link>
    </div>
  );
}

export function StoreSidebar({
  mode,
  categories = defaultCategories,
  selectedCategories = [],
  onCategoryChange,
  categoryCounts = { Software: 0, Art: 0, Music: 0, Templates: 0, Other: 0 },
  currentProduct,
  sellerTab = 'products',
  onSellerTabChange,
  productContentTab = 'product',
  onProductTabChange,
}: StoreSidebarProps) {
  const router = useRouter();
  const isListing = mode === 'listing';
  const isProduct = mode === 'product';
  const isDashboard = mode === 'dashboard';

  const backHref = isListing ? '/hub' : '/store';
  const backLabel = isListing ? 'Back to Hub' : 'Back to Store';

  const goSellerTab = (tab: StoreSellerTab) => {
    if (onSellerTabChange) {
      onSellerTabChange(tab);
      return;
    }
    router.push(storeSellerTabHref(tab));
  };

  const handleCategoryToggle = (id: string) => {
    if (!onCategoryChange) return;
    const cat = id as ProductCategory;
    const newCats = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCats);
  };

  const goProductTab = (tab: StoreProductContentTab) => {
    onProductTabChange?.(tab);
    window.setTimeout(() => {
      const section = STORE_PRODUCT_TABS.find((item) => item.id === tab);
      document.getElementById(section?.sidebarId ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const categoryItems = categories?.map((cat) => ({
    id: cat,
    label: cat,
    count: categoryCounts?.[cat] ?? 0,
    icon: <StoreCategoryIcon id={cat} className="opacity-70 group-hover:text-[#02abb8]" />,
  })) ?? [];

  return (
    <UnifiedSidebar
      storageKeyPrefix="store"
      header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}
    >
      {isListing && (
        <>
          <Suspense fallback={<StoreListingQuickLinksFallback />}>
            <StoreListingQuickLinks />
          </Suspense>
          <SidebarCategories
            title="Categories"
            items={categoryItems}
            selectedIds={selectedCategories}
            onSelect={handleCategoryToggle}
            multi={true}
            collapsedItemCount={5}
          />
        </>
      )}

      {isDashboard && (
        <SidebarSection title="Seller Panel">
          <nav className="space-y-1">
            {SELLER_TAB_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={sellerTab === item.id}
                onClick={() => goSellerTab(item.id)}
              />
            ))}
          </nav>
        </SidebarSection>
      )}

      {isProduct && (
        <Suspense fallback={<StoreListingQuickLinksFallback />}>
          <StoreListingQuickLinks />
        </Suspense>
      )}

      {isProduct && currentProduct && onProductTabChange ? (
        <SidebarSection title="On this page" className="mt-2">
          <nav className="space-y-1">
            {STORE_PRODUCT_TABS.map((section) => (
              <SidebarNavItem
                key={section.id}
                label={section.label}
                icon={productSectionIcon}
                active={productContentTab === section.id}
                onClick={() => goProductTab(section.id)}
              />
            ))}
          </nav>
        </SidebarSection>
      ) : null}
    </UnifiedSidebar>
  );
}
