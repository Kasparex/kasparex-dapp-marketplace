'use client';

import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

const timelineIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const kbIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const apiIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function DevelopmentSidebar() {
  const pathname = usePathname();
  const isUpdates = pathname === '/updates';

  return (
    <UnifiedSidebar
      storageKeyPrefix="development"
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
      <SidebarSection title="Development">
        <div className="space-y-0.5">
          <SidebarNavItem
            href="/updates"
            label="Development Timeline"
            icon={timelineIcon}
            active={isUpdates}
          />
          <SidebarNavItem
            href="/knowledge-base"
            label="Knowledge Base"
            icon={kbIcon}
          />
          <SidebarNavItem
            href="/api"
            label="API"
            icon={apiIcon}
          />
        </div>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
