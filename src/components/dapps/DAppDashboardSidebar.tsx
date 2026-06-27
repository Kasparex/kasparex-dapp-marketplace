'use client';

import type { ReactNode } from 'react';
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

const DASHBOARD_TAB_ITEMS: { id: DAppDashboardTab; label: string; icon: ReactNode }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'listings',
    label: 'My Listings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'List a DApp',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
];

export function DAppDashboardSidebar({
  dashboardTab,
  onDashboardTabChange,
  totalListings = 0,
}: DAppDashboardSidebarProps) {
  const router = useRouter();

  const goTab = (tab: DAppDashboardTab) => {
    if (onDashboardTabChange) {
      onDashboardTabChange(tab);
      return;
    }
    router.push(dAppDashboardTabHref(tab));
  };

  const footer = (
    <div className="flex items-center gap-3 p-4 bg-transparent border-t border-zinc-200 dark:border-zinc-800">
      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black text-[10px]">
        KD
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">
          Kasparex dApps
        </p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase">Directory listings</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="dapps-dashboard"
      header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
      footer={footer}
    >
      <SidebarSection title="dApp Panel">
        <nav className="space-y-1">
          {DASHBOARD_TAB_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={dashboardTab === item.id}
              onClick={() => goTab(item.id)}
            />
          ))}
        </nav>
      </SidebarSection>

      <SidebarSection title="Summary" className="mt-4">
        <div className="px-3 py-2 space-y-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Directory listings</div>
            <div className="text-lg font-black text-cyan-600 dark:text-cyan-400">{totalListings}</div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Promotional listings only. Full dApp editor and token integration coming later.
          </p>
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
