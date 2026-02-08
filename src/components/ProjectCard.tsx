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
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-[#02abb8]/10 hover:border-[#02abb8]/30 hover:-translate-y-2 transition-all duration-500 relative flex flex-col min-h-[320px] group"
    >
      {/* Premium Gradient Header Visuals */}
      <div className={`relative w-full h-40 overflow-hidden flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-br transition-all duration-700 group-hover:scale-[1.05] ${project.category === 'Publishing' ? 'from-orange-500 to-amber-600' :
        project.category === 'Media' ? 'from-purple-500 to-pink-600' :
          project.category === 'Finance' ? 'from-[#02abb8] to-cyan-600' :
            project.category === 'Entertainment' ? 'from-blue-500 to-indigo-600' :
              project.category === 'Infrastructure' ? 'from-zinc-700 to-zinc-900' :
                project.category === 'Creator Tools' ? 'from-cyan-500 to-blue-600' :
                  project.category === 'Marketplace' ? 'from-[#02abb8] to-teal-600' :
                    project.category === 'Ecosystem' ? 'from-emerald-500 to-green-600' :
                      project.category === 'NFTs' ? 'from-pink-500 to-rose-600' :
                        project.category === 'Utility' ? 'from-indigo-500 to-purple-600' :
                          'from-zinc-800 to-black'
        }`}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] group-hover:opacity-20 transition-opacity duration-700" />

        {/* Subtle Brand Icon Overlay */}
        <div className="relative z-10 opacity-50 group-hover:opacity-90 transition-all duration-700 transform group-hover:scale-125 group-hover:rotate-6">
          {project.category === 'Publishing' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          )}
          {project.category === 'Media' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {(project.category === 'Finance' || project.category === 'Marketplace') && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {project.category === 'Utility' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          )}
          {project.category === 'Ecosystem' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          )}
          {project.category === 'NFTs' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {project.category === 'Infrastructure' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          )}
          {project.category === 'Creator Tools' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
          {project.category === 'Entertainment' && (
            <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      <div className="p-6 relative z-10 flex flex-col flex-1 min-h-0">
        {/* Status Badge - Top Right */}
        {getStatusBadge() && (
          <div className="absolute top-6 right-6 z-10">
            {getStatusBadge()}
          </div>
        )}

        {/* Project Title */}
        <div className="mb-4 pr-24">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors duration-300">
            {project.name}
          </h3>
        </div>

        {/* Description Section */}
        <div className="mb-4 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Bottom Section: Category Badge */}
        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            {/* Category Badge */}
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#02abb8]/10 text-[#02abb8] border border-[#02abb8]/20">
              {project.category}
            </div>
            {/* Arrow Icon */}
            <div className="text-[#02abb8] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
