'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Token } from '@/lib/tokens/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { SidebarTags } from '@/components/sidebar/SidebarTags';
import { getAllTokenTags } from '@/lib/tokens/tags';
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

export function TokensListingSidebar({
  tokens = [],
  utilityFilter = 'all',
  moduleFilter = 'all',
  onUtilityFilterChange,
  onModuleFilterChange,
  showUtilityFilter = false,
  selectedTags = [],
  onTagToggle,
}: {
  tokens?: Token[];
  utilityFilter?: TokenUtilitySectionFilter;
  moduleFilter?: TokenModuleSectionFilter;
  onUtilityFilterChange?: (value: TokenUtilitySectionFilter) => void;
  onModuleFilterChange?: (value: TokenModuleSectionFilter) => void;
  showUtilityFilter?: boolean;
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
}) {
  const pathname = usePathname();
  const dashboardActive = pathname?.startsWith('/tokens/dashboard') ?? false;

  const utilityItems = useMemo(() => buildTokenUtilitySectionItems(tokens), [tokens]);
  const moduleItems = useMemo(() => buildTokenModuleSectionItems(), []);
  const allTags = useMemo(() => getAllTokenTags(tokens), [tokens]);

  const tokensFooter = (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">KT</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">Kasparex Tokens</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase">Ecosystem</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="tokens-listing"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      footer={tokensFooter}
    >
      <div className="mb-6">
        <Link
          href="/tokens/dashboard"
          className={`k-control-btn w-full justify-center gap-2 ${dashboardActive ? '!bg-cyan-600 !text-white' : ''}`}
        >
          <svg className={dashboardActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Dashboard
        </Link>
      </div>

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
