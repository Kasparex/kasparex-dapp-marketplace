'use client';

import Link from 'next/link';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

const QUICK_LINKS = [
  { href: '/api/krex-node', label: 'Run a KREX Node', icon: 'run' },
  { href: '/api', label: 'API overview', icon: 'api' },
  { href: '/knowledge-base', label: 'Knowledge base', icon: 'book' },
  { href: 'https://github.com/Kasparex/kasparex-krex-node', label: 'GitHub repo', icon: 'external', external: true },
] as const;

const NODES_SECTIONS = [
  { id: 'connect-register', label: 'Connect & Register', icon: 'link' },
  { id: 'node-type', label: 'Node Type', icon: 'node' },
  { id: 'status-parameters', label: 'Status & Parameters', icon: 'chart' },
  { id: 'technical-requirements', label: 'Technical Requirements', icon: 'clipboard' },
  { id: 'incentives-earnings', label: 'Incentives & Earnings', icon: 'currency' },
] as const;

const ICONS: Record<string, React.ReactNode> = {
  link: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  node: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9a1 1 0 01-1-1v-2z" />
    </svg>
  ),
  currency: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  run: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  api: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  book: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  external: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

export function NodesDashboardSidebar() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="nodes-dashboard"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      defaultWidth={300}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
            Quick links
          </h3>
          <nav className="space-y-1">
            {QUICK_LINKS.map((item) =>
              'external' in item && item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
                >
                  <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                    {ICONS[item.icon]}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
                >
                  <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                    {ICONS[item.icon]}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">{item.label}</span>
                </Link>
              )
            )}
          </nav>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
            On this page
          </h3>
          <nav className="space-y-1">
            {NODES_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
              >
                <span className="k-sidebar-icon transition-colors duration-200 text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 flex-shrink-0">
                  {ICONS[section.icon] ?? ICONS.node}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider transition-colors min-w-0 break-words">
                  {section.label}
                </span>
              </button>
            ))}
          </nav>
        </section>
      </div>
    </UnifiedSidebar>
  );
}
