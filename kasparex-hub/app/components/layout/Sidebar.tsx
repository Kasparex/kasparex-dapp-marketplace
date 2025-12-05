/**
 * Collapsible Sidebar Component
 * 
 * Sidebar with chevron toggle for collapse/expand
 * Mobile: overlay mode with backdrop
 * Desktop: fixed position, collapsible width
 */

import { useState } from "react";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className = "" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar
          ${isCollapsed ? 'collapsed' : ''}
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] lg:h-auto
          w-64 lg:w-64
          bg-white dark:bg-zinc-900
          border-r border-zinc-200 dark:border-zinc-800
          z-50 lg:z-auto
          transition-transform duration-300 ease-in-out
          ${className}
        `}
      >
        {/* Chevron Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Sidebar Content */}
        {!isCollapsed && (
          <div className="h-full overflow-y-auto p-4">
            {children}
          </div>
        )}
      </aside>
    </>
  );
}



