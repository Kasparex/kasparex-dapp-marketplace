'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Token } from '@/lib/tokens/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarTags } from '@/components/sidebar/SidebarTags';
import { getAllTokenTags } from '@/lib/tokens/tags';
import { getTokenCategoriesFromTokens, getTokenCategory } from '@/lib/tokens/categories';
import {
  buildTokenModuleSectionItems,
  buildTokenUtilitySectionItems,
  type TokenModuleSectionFilter,
  type TokenUtilitySectionFilter,
} from '@/lib/tokens/utilityFilters';
import {
  getTokenModuleSectionIcon,
  getTokenUtilitySectionIcon,
} from '@/lib/tokens/sidebarIcons';

const SIDEBAR_BTN_ICON = 'w-4 h-4 shrink-0 text-zinc-800 dark:text-zinc-200';
const SIDEBAR_BTN_ICON_ACTIVE = `${SIDEBAR_BTN_ICON} !text-white`;
const ALL_CATEGORIES_ID = 'all';

const DASHBOARD_SECTIONS: Array<{ label: string; anchor: string }> = [
  { label: 'Create listing', anchor: 'tokens-dashboard-main' },
  { label: 'Fees & rewards', anchor: 'tokens-dashboard-pricing' },
  { label: 'Listing media', anchor: 'tokens-dashboard-media' },
  { label: 'Page sections', anchor: 'tokens-dashboard-sections' },
  { label: 'Premium modules', anchor: 'tokens-dashboard-modules' },
  { label: 'My tokens', anchor: 'tokens-dashboard-archive' },
];

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function TokenCategoryIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`k-sidebar-icon text-zinc-800 dark:text-zinc-200 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

export function TokensListingSidebar({
  tokens = [],
  utilityFilter = 'all',
  moduleFilter = 'all',
  onUtilityFilterChange,
  onModuleFilterChange,
  showUtilityFilter = false,
  selectedCategory = null,
  onCategoryChange,
  selectedTags = [],
  onTagToggle,
  backHref = '/hub',
  backLabel = 'Back to Hub',
}: {
  tokens?: Token[];
  utilityFilter?: TokenUtilitySectionFilter;
  moduleFilter?: TokenModuleSectionFilter;
  onUtilityFilterChange?: (value: TokenUtilitySectionFilter) => void;
  onModuleFilterChange?: (value: TokenModuleSectionFilter) => void;
  showUtilityFilter?: boolean;
  selectedCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const dashboardActive = pathname?.startsWith('/tokens/dashboard') ?? false;

  const utilityItems = useMemo(() => buildTokenUtilitySectionItems(tokens), [tokens]);
  const moduleItems = useMemo(() => buildTokenModuleSectionItems(), []);
  const allTags = useMemo(() => getAllTokenTags(tokens), [tokens]);
  const categories = useMemo(() => getTokenCategoriesFromTokens(tokens), [tokens]);

  const categoryItems = useMemo(
    () => [
      { id: ALL_CATEGORIES_ID, label: 'All categories', count: tokens.length, icon: <TokenCategoryIcon /> },
      ...categories.map((category) => ({
        id: category,
        label: category,
        count: tokens.filter((token) => getTokenCategory(token) === category).length,
        icon: <TokenCategoryIcon />,
      })),
    ],
    [categories, tokens],
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="tokens-listing"
      header={(onHide) => (
        <SidebarHeader
          backHref={backHref}
          backLabel={backLabel}
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
    >
      <div className="mb-6">
        <Link
          href="/tokens/dashboard"
          className={`k-control-btn w-full justify-center gap-2 ${
            dashboardActive ? 'hub-sidebar-action-active' : ''
          }`}
        >
          <svg className={dashboardActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Dashboard
        </Link>
      </div>

      {dashboardActive ? (
        <SidebarSection title="On this page" className="mb-6">
          <nav className="space-y-0.5">
            {DASHBOARD_SECTIONS.map((item) => (
              <SidebarNavItem
                key={item.anchor}
                href={`#${item.anchor}`}
                onLinkClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor(item.anchor);
                }}
                label={item.label}
                icon={<TokenCategoryIcon className="!h-4 !w-4" />}
              />
            ))}
          </nav>
        </SidebarSection>
      ) : null}

      {onCategoryChange ? (
        <SidebarCategories
          title="Categories"
          items={categoryItems}
          selectedIds={selectedCategory ?? ALL_CATEGORIES_ID}
          onSelect={(id) => onCategoryChange(id === ALL_CATEGORIES_ID ? null : id)}
          multi={false}
          searchable
          searchPlaceholder="Search categories..."
          collapsedItemCount={5}
          className="mb-6"
        />
      ) : null}

      {showUtilityFilter && onUtilityFilterChange && onModuleFilterChange ? (
        <>
          <SidebarCategories
            title="Utility"
            items={utilityItems.map((item) => ({
              id: item.id,
              label: item.label,
              count: item.count,
              icon: getTokenUtilitySectionIcon(item.id),
            }))}
            selectedIds={utilityFilter}
            onSelect={(id) => onUtilityFilterChange(id as TokenUtilitySectionFilter)}
            multi={false}
            searchable
            searchPlaceholder="Search utility..."
            collapsedItemCount={5}
            className="mb-6"
          />
          <SidebarCategories
            title="Modules"
            items={moduleItems.map((item) => ({
              id: item.id,
              label: item.label,
              icon: getTokenModuleSectionIcon(item.id),
            }))}
            selectedIds={moduleFilter}
            onSelect={(id) => onModuleFilterChange(id as TokenModuleSectionFilter)}
            multi={false}
            searchable
            searchPlaceholder="Search modules..."
            collapsedItemCount={5}
            className="mb-6"
          />
        </>
      ) : null}

      {allTags.length > 0 && onTagToggle ? (
        <SidebarTags
          title="Tags"
          tags={allTags}
          selectedTags={selectedTags}
          onToggle={onTagToggle}
          className="mb-6"
        />
      ) : null}
    </UnifiedSidebar>
  );
}
