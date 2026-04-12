'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResolveSidebarNavHref } from '@/hooks/useResolveSidebarNavHref';
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
  const pathname = usePathname();
  const toNav = useResolveSidebarNavHref();

  return (
    <UnifiedSidebar
      storageKeyPrefix="stats"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
        />
      )}
      defaultWidth={260}
    >
      <div className="flex-1 overflow-y-auto space-y-8">
        {/* Quick Stats Box for Consistency */}
        <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/20">
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3">
            Ecosystem Stats
          </div>
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

        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
            Main Stats
          </h3>
          <nav className="space-y-1">
            {STATS_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
              <Link
                key={item.label}
                href={toNav(item.href)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-[#02abb8]/10 text-[#02abb8] border border-[#02abb8]/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">
                  {item.label}
                </span>
              </Link>
            )})}
          </nav>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
            Resources
          </h3>
          <nav className="space-y-1">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.label}
                href={toNav(item.href)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
