'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { DAppDashboardTab } from '@/lib/dapps/dashboardTabs';
import { dAppDashboardTabHref } from '@/lib/dapps/dashboardTabs';

export type DAppDashboardSidebarProps = {
  dashboardTab: DAppDashboardTab;
  onDashboardTabChange?: (tab: DAppDashboardTab) => void;
  totalListings?: number;
};

const SIDEBAR_BTN_ICON = 'w-3.5 h-3.5';
const SIDEBAR_BTN_ICON_ACTIVE = 'w-3.5 h-3.5 text-white';

const DASHBOARD_SECTIONS: Array<{ id: DAppDashboardTab | 'pricing' | 'modules'; label: string; tab: DAppDashboardTab; anchor?: string }> = [
  { id: 'create', label: 'List a DApp', tab: 'create', anchor: 'dapps-dashboard-create' },
  { id: 'pricing', label: 'Fees & rewards', tab: 'create', anchor: 'dapps-dashboard-pricing' },
  { id: 'modules', label: 'Premium modules', tab: 'create', anchor: 'dapps-dashboard-modules' },
  { id: 'listings', label: 'My Listings', tab: 'listings' },
  { id: 'overview', label: 'Overview', tab: 'overview' },
];

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function DAppDashboardSidebar({
  dashboardTab,
  onDashboardTabChange,
  totalListings = 0,
}: DAppDashboardSidebarProps) {
  const router = useRouter();

  const goTab = (tab: DAppDashboardTab, anchor?: string) => {
    if (onDashboardTabChange) {
      onDashboardTabChange(tab);
    } else {
      router.push(dAppDashboardTabHref(tab));
    }
    if (anchor) {
      window.setTimeout(() => scrollToAnchor(anchor), 80);
    }
  };

  const footer = (
    <div className="flex items-center gap-3 border-t border-zinc-200 bg-transparent p-4 dark:border-zinc-800">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-[10px] font-black text-cyan-600 dark:text-cyan-400">
        KD
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          Kasparex dApps
        </p>
        <p className="text-[9px] font-bold uppercase text-zinc-500">Directory listings</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="dapps-dashboard"
      header={(onHide) => <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />}
      footer={footer}
    >
      <div className="mb-6 space-y-2 px-1">
        <Link
          href="/dapps/dashboard?tab=create"
          className={`k-control-btn w-full justify-center gap-2 ${dashboardTab === 'create' ? '!bg-cyan-600 !text-white' : ''}`}
        >
          <svg className={dashboardTab === 'create' ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Creator Dashboard
        </Link>
        <Link href="/dapps" className="k-control-btn w-full justify-center gap-2">
          <svg className={SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Browse dApps
        </Link>
      </div>

      <SidebarSection title="Dashboard sections">
        <nav className="space-y-1">
          {DASHBOARD_SECTIONS.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              active={
                item.tab === dashboardTab &&
                (item.id === 'pricing' || item.id === 'modules' ? dashboardTab === 'create' : true) &&
                (item.id === dashboardTab || (dashboardTab === 'create' && (item.id === 'pricing' || item.id === 'modules' || item.id === 'create')))
              }
              onClick={() => goTab(item.tab, item.anchor)}
            />
          ))}
        </nav>
      </SidebarSection>

      <SidebarSection title="Summary" className="mt-4">
        <div className="space-y-3 px-3 py-2">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase text-zinc-500">Directory listings</div>
            <div className="text-lg font-black text-cyan-600 dark:text-cyan-400">{totalListings}</div>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Promotional listings only. Full dApp editor and token integration coming later.
          </p>
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
