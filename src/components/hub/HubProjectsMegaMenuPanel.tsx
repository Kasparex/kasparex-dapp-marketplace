'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { getHubProjectIcon, HubProjectStatusBadge } from '@/components/hub/hubMenuIcons';

const TAB_GROUPS = [
  {
    id: 'discover',
    label: 'Discover',
    categories: ['Utility', 'Standards', 'Finance', 'Entertainment', 'Media'],
  },
  {
    id: 'create',
    label: 'Create',
    categories: ['Publishing', 'Creator Tools'],
  },
  {
    id: 'platform',
    label: 'Platform',
    categories: ['Infrastructure', 'NFTs', 'Marketplace'],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    categories: ['Ecosystem'],
  },
] as const;

export interface HubProjectsMegaMenuPanelProps {
  pathname: string;
  currentProject: HubProject | null;
  onNavigate?: () => void;
}

export function HubProjectsMegaMenuPanel({ pathname, currentProject, onNavigate }: HubProjectsMegaMenuPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof TAB_GROUPS)[number]['id']>('discover');
  const normalizedPath = pathname === '/' ? '/dapps' : pathname;

  const grouped = useMemo(() => {
    const map = new Map<string, HubProject[]>();
    for (const project of hubProjects) {
      const list = map.get(project.category) ?? [];
      list.push(project);
      map.set(project.category, list);
    }
    return map;
  }, []);

  const activeGroup = TAB_GROUPS.find((g) => g.id === activeTab) ?? TAB_GROUPS[0];

  return (
    <div className="flex min-h-0 gap-0">
      <nav
        className="flex w-[7.5rem] shrink-0 flex-col gap-0.5 border-r border-zinc-200 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/40"
        aria-label="Hub project groups"
      >
        {TAB_GROUPS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#02abb8]/12 text-[#028a94] dark:bg-[#02abb8]/20 dark:text-[#66dfe8]'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
              aria-pressed={active}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {activeGroup.categories.map((category) => {
            const projects = grouped.get(category);
            if (!projects?.length) return null;
            return (
              <div key={category} className="min-w-0">
                <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {category}
                </p>
                <ul className="space-y-0">
                  {projects.map((project) => {
                    const isExternal = project.route.startsWith('http');
                    const isActive =
                      currentProject?.id === project.id ||
                      project.route === normalizedPath ||
                      (normalizedPath.startsWith(project.route) && project.route !== '/');
                    const ProjectIcon = getHubProjectIcon(project.id);
                    const itemClass = `flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'k-sidebar-item-active'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`;

                    const content = (
                      <>
                        <ProjectIcon className="w-4 h-4 shrink-0 k-sidebar-icon text-zinc-500 dark:text-zinc-400" />
                        <span className="min-w-0 flex-1 font-medium leading-snug">{project.name}</span>
                        {project.status !== 'available' ? <HubProjectStatusBadge status={project.status} /> : null}
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
                            onClick={onNavigate}
                          >
                            {content}
                          </a>
                        ) : (
                          <Link href={project.route} className={itemClass} onClick={onNavigate}>
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
