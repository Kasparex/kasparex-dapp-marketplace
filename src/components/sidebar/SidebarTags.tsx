'use client';

import { useMemo, useState, type ReactNode } from 'react';
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
  searchPlaceholder?: string;
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
  searchPlaceholder = 'Search tags...',
}: SidebarTagsProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (tags.length === 0) return null;

  const showSearch = tags.length > 6;

  const filteredTags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) => tag.toLowerCase().includes(q));
  }, [tags, searchQuery]);

  const needsCollapse = collapsedItemCount != null && filteredTags.length > collapsedItemCount;
  const visibleTags = needsCollapse && !expanded ? filteredTags.slice(0, collapsedItemCount!) : filteredTags;
  const hiddenCount = needsCollapse ? filteredTags.length - collapsedItemCount! : 0;

  return (
    <SidebarSection title={title} className={className}>
      {showSearch ? (
        <div className="mb-2 px-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpanded(false);
            }}
            placeholder={searchPlaceholder}
            aria-label={`Search ${title.toLowerCase()}`}
            className="k-input w-full !py-1.5 !text-sm !leading-6 !rounded-lg"
          />
        </div>
      ) : null}
      {filteredTags.length === 0 ? (
        <p className="px-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">No matches.</p>
      ) : (
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
      )}
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
