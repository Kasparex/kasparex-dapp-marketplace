'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

const TOC_ITEMS = [
  { id: 'what-is-krex-node', label: 'What is a KREX Node?', icon: 'node' },
  { id: 'node-types', label: 'Node Types', icon: 'types' },
  { id: 'how-to-run', label: 'How to Run a KREX Node', icon: 'run' },
  { id: 'rewards', label: 'How Rewards Work', icon: 'rewards' },
  { id: 'safety', label: 'Is it Safe?', icon: 'safety' },
  { id: 'who-is-this-for', label: 'Who is this for?', icon: 'who' },
] as const;

const ICONS: Record<string, React.ReactNode> = {
  node: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  types: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9a1 1 0 01-1-1v-2z" />
    </svg>
  ),
  run: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  rewards: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  safety: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  who: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export function KrexNodeDocSidebar() {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = TOC_ITEMS.map((item) => {
        const element = document.getElementById(item.id);
        return { id: item.id, top: element?.getBoundingClientRect().top ?? 0 };
      });
      const current = sections.filter((s) => s.top <= 120).sort((a, b) => b.top - a.top)[0];
      if (current) setActiveId(current.id);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="krex-node-doc"
      header={(onHide) => (
        <SidebarHeader
          backHref="/api"
          backLabel="Back to API"
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
            <Link href="/nodes" className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3">
              <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">Nodes dashboard</span>
            </Link>
            <Link href="/api" className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3">
              <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">API overview</span>
            </Link>
            <Link href="/knowledge-base" className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3">
              <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">Knowledge base</span>
            </Link>
            <a
              href="https://github.com/Kasparex/kasparex-krex-node"
              target="_blank"
              rel="noopener noreferrer"
              className="k-sidebar-item w-full text-left group flex items-center gap-3 !px-3"
            >
              <span className="k-sidebar-icon text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">GitHub repo</span>
            </a>
          </nav>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
            On this page
          </h3>
          <nav className="space-y-1">
            {TOC_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`k-sidebar-item w-full text-left group flex items-center gap-3 !px-3 ${activeId === item.id ? 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400' : ''}`}
              >
                <span className={`k-sidebar-icon transition-colors duration-200 flex-shrink-0 ${activeId === item.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`}>
                  {ICONS[item.icon] ?? ICONS.node}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider min-w-0 break-words">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </section>
      </div>
    </UnifiedSidebar>
  );
}
