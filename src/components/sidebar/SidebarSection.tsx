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
      <div
        className={
          headingClassName ??
          'text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2'
        }
      >
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
