'use client';

import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { getHubProjectIcon, HubProjectStatusBadge } from '@/components/hub/hubMenuIcons';

/** Three topic columns for the desktop mega menu (projects stacked vertically). */
const MEGA_MENU_COLUMNS: { title: string; projectIds: string[] }[] = [
  {
    title: 'Explore',
    projectIds: [
      'kasparex-dapps',
      'kasparex-protocols',
      'kasparex-tokens',
      'kasparex-defi',
      'kasparex-games',
      'kasparex-store',
      'kasparex-nft-tools',
    ],
  },
  {
    title: 'Create',
    projectIds: [
      'kasparex-vblog',
      'kasparex-magazines',
      'krex-chronicles',
      'kasparex-studio',
      'kasparex-donations',
      'kasparex-records',
      'kasparex-movies',
    ],
  },
  {
    title: 'Platform',
    projectIds: [
      'krex-nodes',
      'kasparex-ai',
      'kasparex-rewards',
      'kasparex-stats',
      'kasparex-ads',
      'revenue-tree',
    ],
  },
];

const projectById = new Map(hubProjects.map((p) => [p.id, p]));

export interface HubProjectsMegaMenuPanelProps {
  pathname: string;
  currentProject: HubProject | null;
  onNavigate?: () => void;
}

export function HubProjectsMegaMenuPanel({ pathname, currentProject, onNavigate }: HubProjectsMegaMenuPanelProps) {
  const normalizedPath = pathname === '/' ? '/dapps' : pathname;

  return (
    <div className="grid grid-cols-3 gap-4 p-2">
      {MEGA_MENU_COLUMNS.map((column) => (
        <div key={column.title} className="min-w-0">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {column.title}
          </p>
          <ul className="space-y-0.5">
            {column.projectIds.map((id) => {
              const project = projectById.get(id);
              if (!project) return null;

              const isExternal = project.route.startsWith('http');
              const isActive =
                currentProject?.id === project.id ||
                project.route === normalizedPath ||
                (normalizedPath.startsWith(project.route) && project.route !== '/');
              const ProjectIcon = getHubProjectIcon(project.id);
              const itemClass = `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'k-hub-mega-item-active'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`;

              const content = (
                <>
                  <ProjectIcon className="w-4 h-4 shrink-0 k-sidebar-icon text-zinc-500 dark:text-zinc-400" />
                  <span className="k-hub-mega-label flex-1 min-w-0 font-medium leading-snug">{project.name}</span>
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
