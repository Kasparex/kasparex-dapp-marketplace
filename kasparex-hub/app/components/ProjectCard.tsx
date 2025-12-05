import { Link } from "@remix-run/react";
import type { HubProject } from "~/lib/hubProjects";

interface ProjectCardProps {
  project: HubProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = () => {
    switch (project.status) {
      case 'demo':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
            Demo
          </span>
        );
      case 'beta':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
            Beta
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
            Coming Soon
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      to={project.route}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[280px]"
    >
      {/* Default Featured Image Banner */}
      <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
        <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="p-4 relative z-10 flex flex-col flex-1 min-h-0">
        {/* Status Badge - Top Right */}
        {getStatusBadge() && (
          <div className="absolute top-4 right-4 z-10">
            {getStatusBadge()}
          </div>
        )}

        {/* Project Title */}
        <div className="mb-3 pr-20">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h3>
        </div>

        {/* Description Section */}
        <div className="mb-3 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {project.description}
          </p>
        </div>

        {/* Bottom Section: Category Badge */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Badge */}
            <div className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
              {project.category}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}



