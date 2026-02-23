'use client';

import Link from 'next/link';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

const STATS_LINKS = [
  { href: '/stats', label: 'Overview' },
  { href: '/stats/contracts', label: 'Smart contracts' },
] as const;

const QUICK_LINKS = [
  { href: '/hub', label: 'Hub' },
  { href: '/', label: 'dApps' },
  { href: '/nodes', label: 'KREX Nodes' },
  { href: '/points', label: 'Rewards' },
] as const;

export function StatsSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="stats"
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
      <div className="flex-1 overflow-y-auto space-y-6">
        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-0">
            Stats
          </h3>
          <nav className="space-y-1">
            {STATS_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </section>
        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-0">
            Quick links
          </h3>
          <nav className="space-y-1">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </UnifiedSidebar>
  );
}
