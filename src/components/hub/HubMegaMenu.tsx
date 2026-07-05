'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

function getProjectIcon(projectId: string) {
  const iconMap: Record<string, (props: { className?: string }) => React.ReactElement> = {
    'kasparex-dapps': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'kasparex-protocols': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'kasparex-tokens': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'kasparex-games': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'kasparex-vblog': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    'kasparex-magazines': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'krex-chronicles': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'kasparex-defi': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    'kasparex-studio': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    'krex-nodes': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    'kasparex-rewards': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    'kasparex-nft-tools': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    'kasparex-store': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
    'kasparex-donations': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    'revenue-tree': ({ className = 'w-4 h-4' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return iconMap[projectId] || iconMap['kasparex-dapps'];
}

function StatusBadge({ status }: { status: HubProject['status'] }) {
  const base = 'px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0';
  switch (status) {
    case 'demo':
      return <span className={`${base} bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300`}>Demo</span>;
    case 'beta':
      return <span className={`${base} bg-purple-100/80 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300`}>Beta</span>;
    case 'coming-soon':
      return <span className={`${base} bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300`}>Soon</span>;
    default:
      return null;
  }
}

export interface HubMegaMenuProps {
  currentSectionTitle: string;
  currentProject: HubProject | null;
  pathname: string;
}

export function HubMegaMenu({ currentSectionTitle, currentProject, pathname }: HubMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, HubProject[]>();
    for (const project of hubProjects) {
      const list = map.get(project.category) ?? [];
      list.push(project);
      map.set(project.category, list);
    }
    return Array.from(map.entries());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener('click', onClick, true), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', onClick, true);
    };
  }, [open]);

  const normalizedPath = pathname === '/' ? '/dapps' : pathname;

  const panel = open ? (
    <>
      <div className="fixed inset-0 z-[100] bg-black/20 lg:bg-transparent" aria-hidden onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        className="fixed left-3 right-3 sm:left-4 sm:right-auto sm:w-[min(calc(100vw-2rem),420px)] lg:absolute lg:left-0 lg:right-auto lg:top-full lg:mt-2 lg:w-[min(calc(100vw-1rem),520px)] top-[4.25rem] z-[101] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        role="menu"
      >
        <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Hub projects</p>
        </div>
        <div className="max-h-[min(calc(100dvh-6rem),480px)] overflow-y-auto overscroll-contain p-2 space-y-3">
          {grouped.map(([category, projects]) => (
            <div key={category}>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {category}
              </p>
              <ul className="space-y-0.5">
                {projects.map((project) => {
                  const isExternal = project.route.startsWith('http');
                  const isActive =
                    currentProject?.id === project.id ||
                    project.route === normalizedPath ||
                    (normalizedPath.startsWith(project.route) && project.route !== '/');
                  const ProjectIcon = getProjectIcon(project.id);
                  const itemClass = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'k-sidebar-item-active'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`;

                  const content = (
                    <>
                      <ProjectIcon className="w-4 h-4 shrink-0 k-sidebar-icon text-zinc-500 dark:text-zinc-400" />
                      <span className="flex-1 min-w-0 truncate font-medium">{project.name}</span>
                      {project.status !== 'available' ? <StatusBadge status={project.status} /> : null}
                    </>
                  );

                  return (
                    <li key={project.id}>
                      {isExternal ? (
                        <a
                          href={project.route}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={itemClass}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                        >
                          {content}
                        </a>
                      ) : (
                        <Link href={project.route} className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 min-w-0 max-w-[46vw] sm:max-w-none rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {currentSectionTitle}
        </span>
        {currentProject?.status && currentProject.status !== 'available' ? (
          <StatusBadge status={currentProject.status} />
        ) : null}
        <svg
          className={`w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {mounted && open ? createPortal(panel, document.body) : null}
    </div>
  );
}
