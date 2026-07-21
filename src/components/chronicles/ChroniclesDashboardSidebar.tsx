'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { ChroniclesCenterTab } from '@/lib/chronicles/centerTabs';
import { chroniclesCenterTabHref } from '@/lib/chronicles/centerTabs';

export type ChroniclesDashboardSidebarProps = {
  dashboardTab: ChroniclesCenterTab;
  onDashboardTabChange?: (tab: ChroniclesCenterTab) => void;
  totalListings?: number;
};

const SIDEBAR_BTN_ICON = 'w-3.5 h-3.5';
const SIDEBAR_BTN_ICON_ACTIVE = 'w-3.5 h-3.5 text-white';

const DASHBOARD_SECTIONS: Array<{
  id: ChroniclesCenterTab | 'pricing' | 'modules';
  label: string;
  tab: ChroniclesCenterTab;
  anchor?: string;
}> = [
  { id: 'create', label: 'Create lore', tab: 'create', anchor: 'chronicles-dashboard-create' },
  { id: 'pricing', label: 'Fees & rewards', tab: 'create', anchor: 'chronicles-dashboard-pricing' },
  { id: 'modules', label: 'Premium modules', tab: 'create', anchor: 'chronicles-dashboard-modules' },
  { id: 'listings', label: 'My Listings', tab: 'listings' },
];

const DASHBOARD_TAB_ICONS: Record<ChroniclesCenterTab | 'pricing' | 'modules', ReactNode> = {
  listings: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  create: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  pricing: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  modules: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
};

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function ChroniclesDashboardSidebar({
  dashboardTab,
  onDashboardTabChange,
  totalListings = 0,
}: ChroniclesDashboardSidebarProps) {
  const router = useRouter();

  const goTab = (tab: ChroniclesCenterTab, anchor?: string) => {
    if (onDashboardTabChange) {
      onDashboardTabChange(tab);
    } else {
      router.push(chroniclesCenterTabHref(tab));
    }
    if (anchor) {
      window.setTimeout(() => scrollToAnchor(anchor), 80);
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="chronicles-dashboard"
      header={(onHide) => <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />}
    >
      <div className="mb-6 space-y-2 px-1">
        <Link
          href="/chronicles/center"
          className={`k-control-btn hub-cta-btn w-full justify-center gap-2 ${
            dashboardTab === 'create' ? 'hub-sidebar-action-active' : ''
          }`}
        >
          <svg
            className={dashboardTab === 'create' ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Creator Dashboard
        </Link>
      </div>

      <SidebarSection title="On this page">
        <nav className="space-y-1">
          {DASHBOARD_SECTIONS.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={DASHBOARD_TAB_ICONS[item.id]}
              active={
                item.tab === dashboardTab &&
                (item.id === 'pricing' || item.id === 'modules'
                  ? dashboardTab === 'create'
                  : item.id === dashboardTab || (dashboardTab === 'create' && item.id === 'create'))
              }
              onClick={() => goTab(item.tab, item.anchor)}
            />
          ))}
        </nav>
      </SidebarSection>

      <SidebarSection title="Summary" className="mt-4">
        <div className="space-y-3 px-3 py-2">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase text-zinc-500">Community submissions</div>
            <div className="text-lg font-black text-[color:var(--hub-accent,#06b6d4)]">{totalListings}</div>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Paid community lore stored in your browser. Appears in listings with a Community badge.
          </p>
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
