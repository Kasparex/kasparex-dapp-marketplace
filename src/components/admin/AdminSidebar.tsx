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

export function AdminSidebar() {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin';
  const isMagazines = pathname.startsWith('/admin/magazines');

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
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
