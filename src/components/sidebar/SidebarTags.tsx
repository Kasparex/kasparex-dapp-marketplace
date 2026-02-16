'use client';

import type { ReactNode } from 'react';
import { SidebarSection } from './SidebarSection';

export interface SidebarTagsProps {
  title?: string;
  sectionIcon?: ReactNode;
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  className?: string;
}

export function SidebarTags({
  title = 'Popular Tags',
  sectionIcon,
  tags,
  selectedTags,
  onToggle,
  className = '',
}: SidebarTagsProps) {
  if (tags.length === 0) return null;
  return (
    <SidebarSection title={title} className={className}>
      <div className="flex flex-wrap gap-2 px-1">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                isSelected
                  ? 'bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>
    </SidebarSection>
  );
}
