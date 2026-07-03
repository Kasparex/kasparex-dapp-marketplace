'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { Token } from '@/lib/tokens/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarQuickActions } from '@/components/sidebar/SidebarQuickActions';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import {
  buildTokenUtilityFilterItems,
  type TokenUtilitySidebarFilter,
} from '@/lib/tokens/utilityFilters';

const SIDEBAR_BTN_ICON = 'w-4 h-4 shrink-0 text-zinc-800 dark:text-zinc-200';
const SIDEBAR_BTN_ICON_ACTIVE = `${SIDEBAR_BTN_ICON} !text-white`;

function TokenLinkIcon({ id, className = '' }: { id: string; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  switch (id) {
    case 'hub': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'dapps': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'rewards': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}

const QUICK_LINKS = [
  { id: 'hub', label: 'Back to Hub', href: '/hub', icon: <TokenLinkIcon id="hub" /> },
  { id: 'dapps', label: 'Explore dApps', href: '/', icon: <TokenLinkIcon id="dapps" /> },
  { id: 'rewards', label: 'View Rewards', href: '/rewards', icon: <TokenLinkIcon id="rewards" /> },
];

const UTILITY_SECTION_ICON = (
  <svg className="k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export function TokensListingSidebar({
  tokens = [],
  utilityFilter = 'all',
  onUtilityFilterChange,
  showUtilityFilter = false,
}: {
  tokens?: Token[];
  utilityFilter?: TokenUtilitySidebarFilter;
  onUtilityFilterChange?: (value: TokenUtilitySidebarFilter) => void;
  showUtilityFilter?: boolean;
}) {
  const pathname = usePathname();
  const dashboardActive = pathname?.startsWith('/tokens/dashboard') ?? false;

  const utilityItems = useMemo(() => buildTokenUtilityFilterItems(tokens), [tokens]);

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

      {showUtilityFilter && onUtilityFilterChange ? (
        <SidebarCategories
          title="Utility / Modules"
          sectionIcon={UTILITY_SECTION_ICON}
          items={utilityItems.map((item) => ({
            id: item.id,
            label: item.label,
            count: item.count,
          }))}
          selectedIds={utilityFilter}
          onSelect={(id) => onUtilityFilterChange(id as TokenUtilitySidebarFilter)}
          multi={false}
          searchable
          searchPlaceholder="Search utility..."
          className="mb-6"
        />
      ) : null}

      <SidebarQuickActions title="Quick Links" items={QUICK_LINKS} />
    </UnifiedSidebar>
  );
}
