'use client';

import type { ReactNode } from 'react';

export interface SidebarSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SidebarSection({ title, icon, children, className = '' }: SidebarSectionProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
