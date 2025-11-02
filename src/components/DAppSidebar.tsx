'use client';

import Link from 'next/link';
import { DApp } from '@/lib/dapps';

interface DAppSidebarProps {
  dapp: DApp;
}

export function DAppSidebar({ dapp }: DAppSidebarProps) {
  return (
    <>
      {/* Mobile Back Button */}
      <div className="lg:hidden px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Categories
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 lg:p-6">
            {/* Back to Categories Button */}
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Categories
            </Link>

            {/* Content Area */}
            <div className="space-y-6">
              {/* Description */}
              {dapp.description && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {dapp.description}
                  </p>
                </div>
              )}

              {/* Utility */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>✅</span>
                  <span>Utility</span>
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {dapp.utility}
                </p>
              </div>

              {/* Process */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Process</span>
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {dapp.process}
                </p>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>🧠</span>
                  <span>Benefits</span>
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {dapp.benefits}
                </p>
              </div>

              {/* Developer Info */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Developer
                </h3>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                  {dapp.developer}
                </p>
                
                {/* Developer Links */}
                {dapp.developerLinks && dapp.developerLinks.length > 0 && (
                  <div className="space-y-2">
                    {dapp.developerLinks.slice(0, 3).map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors underline underline-offset-2"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

