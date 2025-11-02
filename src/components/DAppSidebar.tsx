'use client';

import Link from 'next/link';

interface DAppSidebarProps {
  dappName?: string;
  children?: React.ReactNode;
}

export function DAppSidebar({ dappName, children }: DAppSidebarProps) {
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

            {/* Customizable Content Area */}
            <div className="space-y-4">
              {children || (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <p>Custom sidebar content for {dappName || 'this dApp'}.</p>
                  <p className="mt-2 text-xs">This area can be customized per dApp in the future.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

