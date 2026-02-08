'use client';

import Link from 'next/link';
import { HubProject } from '@/lib/hubProjects';

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
      href={project.route}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[280px] group"
    >
      {/* Premium Gradient Header Visuals */}
      <div className={`relative w-full h-32 overflow-hidden flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-br transition-all duration-500 group-hover:scale-[1.02] ${project.category === 'Publishing' ? 'from-orange-500 to-amber-600' :
        project.category === 'Media' ? 'from-purple-500 to-pink-600' :
          project.category === 'Finance' ? 'from-[#02abb8] to-cyan-600' :
            project.category === 'Entertainment' ? 'from-blue-500 to-indigo-600' :
              project.category === 'Infrastructure' ? 'from-zinc-700 to-zinc-900' :
                project.category === 'Creator Tools' ? 'from-cyan-500 to-blue-600' :
                  'from-zinc-800 to-black'
        }`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Subtle Brand Icon Overlay */}
        <div className="relative z-10 opacity-30 group-hover:opacity-50 transition-opacity transform group-hover:scale-110 duration-700">
          {project.category === 'Publishing' && (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          )}
          {project.category === 'Media' && (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {project.category === 'Finance' && (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {project.category === 'Utility' && (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          )}
        </div>
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
    </Link >
  );
}

