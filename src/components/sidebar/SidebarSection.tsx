'use client';

import type { ReactNode } from 'react';
import { HUB_SIDEBAR_TILT } from '@/lib/hub/hubLayout';

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
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className={HUB_SIDEBAR_TILT} aria-hidden="true" />
          {icon != null ? <span className="k-sidebar-icon">{icon}</span> : null}
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
