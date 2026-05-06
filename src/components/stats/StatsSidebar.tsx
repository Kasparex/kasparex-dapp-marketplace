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
  { href: '/', label: 'dApps' },
  { href: '/nodes', label: 'KREX Nodes' },
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
      defaultWidth={260}
    >
      <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/20 mb-6">
        <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Ecosystem Stats</div>
        <div className="space-y-4">
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight mb-0.5">Global Transactions</div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 italic">4.2M+</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight mb-0.5">Connected Nodes</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic">1,248</div>
          </div>
        </div>
      </div>

      <SidebarSection title="Main stats">
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
