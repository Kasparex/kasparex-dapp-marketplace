'use client';

import type { ReactNode } from 'react';

export interface SidebarSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Override section heading size (e.g. Chronicles uses larger labels). */
  headingClassName?: string;
}

export function SidebarSection({ title, icon, children, className = '', headingClassName }: SidebarSectionProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {headingClassName ? (
        <div className={headingClassName}>
          <span>{title}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-[#02abb8]" />
          {icon != null ? <span className="k-sidebar-icon">{icon}</span> : null}
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
