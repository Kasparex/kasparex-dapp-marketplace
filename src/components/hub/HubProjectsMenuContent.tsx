'use client';

import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { getHubProjectIcon, HubProjectStatusBadge } from '@/components/hub/hubMenuIcons';

export interface HubProjectsMenuContentProps {
  pathname: string;
  currentProject: HubProject | null;
  onNavigate?: () => void;
  /** multi-column on desktop mega menu */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function HubProjectsMenuContent({
  pathname,
  currentProject,
  onNavigate,
  columns = 1,
  className = '',
}: HubProjectsMenuContentProps) {
  const normalizedPath = pathname === '/' ? '/dapps' : pathname;

  const grouped = hubProjects.reduce<Map<string, HubProject[]>>((map, project) => {
    const list = map.get(project.category) ?? [];
    list.push(project);
    map.set(project.category, list);
    return map;
  }, new Map());

  const columnClass =
    columns === 4
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
      : columns === 3
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
        : columns === 2
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
          : 'space-y-3';

  return (
    <div className={`${columnClass} ${className}`.trim()}>
      {Array.from(grouped.entries()).map(([category, projects]) => (
        <div key={category} className="min-w-0">
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
              const ProjectIcon = getHubProjectIcon(project.id);
              const itemClass = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'k-sidebar-item-active'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`;

              const content = (
                <>
                  <ProjectIcon className="w-4 h-4 shrink-0 k-sidebar-icon text-zinc-500 dark:text-zinc-400" />
                  <span className="flex-1 min-w-0 truncate font-medium">{project.name}</span>
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
      ))}
    </div>
  );
}
