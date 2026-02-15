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
      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-1">
        {icon != null && <span className="text-[#02abb8] opacity-90">{icon}</span>}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
