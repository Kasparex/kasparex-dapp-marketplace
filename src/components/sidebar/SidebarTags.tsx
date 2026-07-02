'use client';

import { useState, type ReactNode } from 'react';
import { SidebarSection } from './SidebarSection';

export interface SidebarTagsProps {
  title?: string;
  sectionIcon?: ReactNode;
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  className?: string;
  /**
   * When set and `tags.length` exceeds this value, show only the first N tags
   * plus a Load more / Show less control (same pattern as Categories).
   */
  collapsedItemCount?: number;
}

const DEFAULT_COLLAPSED_TAG_COUNT = 22;

export function SidebarTags({
  title = 'Popular Tags',
  sectionIcon,
  tags,
  selectedTags,
  onToggle,
  className = '',
  collapsedItemCount = DEFAULT_COLLAPSED_TAG_COUNT,
}: SidebarTagsProps) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  const needsCollapse = collapsedItemCount != null && tags.length > collapsedItemCount;
  const visibleTags = needsCollapse && !expanded ? tags.slice(0, collapsedItemCount!) : tags;
  const hiddenCount = needsCollapse ? tags.length - collapsedItemCount! : 0;

  return (
    <SidebarSection title={title} className={className}>
      <div className="flex flex-wrap gap-2 px-1">
        {visibleTags.map((tag) => {
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
      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-0 mt-2 w-full k-control-btn"
        >
          {expanded ? 'Show less' : `Load more (${hiddenCount})`}
        </button>
      ) : null}
    </SidebarSection>
  );
}
