'use client';

import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

const STATS_LINKS = [
  { href: '/stats', label: 'Overview' },
  { href: '/stats/contracts', label: 'Smart contracts' },
  { href: '/stats/usage', label: 'Usage monitor' },
] as const;

const QUICK_LINKS = [
  { href: '/hub', label: 'Hub' },
  { href: '/dapps', label: 'dApps' },
  { href: '/nodes', label: 'Kasparex Nodes' },
  { href: '/rewards', label: 'Rewards' },
] as const;

const chartIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const linkIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export function StatsSidebar() {
  const pathname = usePathname();

  return (
    <UnifiedSidebar
      storageKeyPrefix="stats"
      header={(onHide) => <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />}
    >
      <SidebarSection title="Stats">
        <nav className="space-y-0.5">
          {STATS_LINKS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={chartIcon}
              active={pathname === item.href}
            />
          ))}
        </nav>
      </SidebarSection>

      <SidebarSection title="Resources">
        <nav className="space-y-0.5">
          {QUICK_LINKS.map((item) => (
            <SidebarNavItem key={item.href} href={item.href} label={item.label} icon={linkIcon} />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
