'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { ChroniclesCenterTab } from '@/lib/chronicles/centerTabs';
import { chroniclesCenterTabHref } from '@/lib/chronicles/centerTabs';
import { HUB_DASHBOARD_NAV_ICONS } from '@/lib/hub/dashboardNavIcons';

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
  icon: keyof typeof HUB_DASHBOARD_NAV_ICONS;
}> = [
  { id: 'create', label: 'Create lore', tab: 'create', anchor: 'chronicles-dashboard-create', icon: 'form' },
  { id: 'pricing', label: 'Fees & rewards', tab: 'create', anchor: 'chronicles-dashboard-pricing', icon: 'pricing' },
  { id: 'modules', label: 'Premium modules', tab: 'create', anchor: 'chronicles-dashboard-modules', icon: 'modules' },
  { id: 'listings', label: 'My Listings', tab: 'listings', icon: 'listings' },
];

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
      header={(onHide) => (
        <SidebarHeader backHref="/chronicles" backLabel="Back to Chronicles" onHide={onHide} />
      )}
    >
      <div className="mb-6 space-y-2 px-1">
        <Link
          href="/chronicles/center"
          className={`k-control-btn w-full justify-center gap-2 ${
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
              icon={HUB_DASHBOARD_NAV_ICONS[item.icon]}
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
