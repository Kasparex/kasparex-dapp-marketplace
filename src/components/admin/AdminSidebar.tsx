'use client';

import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

const dashboardIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const magazinesIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2v4a2 2 0 002 2h4" />
  </svg>
);

const adsIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const chroniclesIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function AdminSidebar() {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin';
  const isMagazines = pathname.startsWith('/admin/magazines');
  const isAds = pathname.startsWith('/admin/ads');
  const isChronicles = pathname.startsWith('/admin/chronicles');

  return (
    <UnifiedSidebar
      storageKeyPrefix="admin"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      defaultWidth={280}
    >
      <SidebarSection title="Admin">
        <div className="space-y-0.5">
          <SidebarNavItem
            href="/admin"
            label="Admin Dashboard"
            icon={dashboardIcon}
            active={isDashboard}
          />
          <SidebarNavItem
            href="/admin/magazines"
            label="Magazines Center"
            icon={magazinesIcon}
            active={isMagazines}
          />
          <SidebarNavItem
            href="/admin/ads"
            label="Ads"
            icon={adsIcon}
            active={isAds}
          />
          <SidebarNavItem
            href="/admin/chronicles"
            label="Krex's Chronicles"
            icon={chroniclesIcon}
            active={isChronicles}
          />
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
