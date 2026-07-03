'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { SidebarSection } from './SidebarSection';
import { SidebarNavItem } from './SidebarNavItem';
import { KxSearchInput } from '@/components/ui/KxSearchInput';

export interface CategoryItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface SidebarCategoriesProps {
  title?: string;
  sectionIcon?: ReactNode;
  items: CategoryItem[];
  /** Multi-select: selected ids. Single-select: single id or null. */
  selectedIds: string[] | string | null;
  /** Multi-select: toggle id. Single-select: select id. */
  onSelect: (id: string) => void;
  /** If true, use checkboxes (multi-select). If false, single selection (no checkbox). */
  multi?: boolean;
  className?: string;
  /**
   * When set and `items.length` is greater than this value, show only the first N rows
   * plus a **Load more (x)** / **Show less** control (same pattern as the dApps listing sidebar).
   */
  collapsedItemCount?: number;
  /**
   * When true, render only the nav + optional load-more control (no `SidebarSection` wrapper).
   * Use when an outer `SidebarSection` already provides the heading.
   */
  bare?: boolean;
  /**
   * When true (default for lists with more than 6 items), show a search field to filter categories.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function SidebarCategories({
  title = 'Categories',
  sectionIcon,
  items,
  selectedIds,
  onSelect,
  multi: _multi = true,
  className = '',
  collapsedItemCount,
  bare = false,
  searchable,
  searchPlaceholder = 'Search categories...',
}: SidebarCategoriesProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSet = Array.isArray(selectedIds)
    ? new Set(selectedIds)
    : selectedIds != null
      ? new Set([selectedIds])
      : new Set<string>();

  const showSearch = searchable ?? items.length > 6;

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const needsCollapse =
    collapsedItemCount != null && filteredItems.length > collapsedItemCount;
  const visibleItems =
    needsCollapse && !expanded ? filteredItems.slice(0, collapsedItemCount!) : filteredItems;
  const hiddenCount = needsCollapse ? filteredItems.length - collapsedItemCount! : 0;

  const nav = (
    <>
      {showSearch ? (
        <div className="mb-2 px-1">
          <KxSearchInput
            size="compact"
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setExpanded(false);
            }}
            placeholder={searchPlaceholder}
            aria-label={`Search ${title.toLowerCase()}`}
          />
        </div>
      ) : null}
      {filteredItems.length === 0 ? (
        <p className="px-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">No matches.</p>
      ) : (
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const isChecked = selectedSet.has(item.id);
            return (
              <SidebarNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                count={item.count}
                active={isChecked}
                onClick={() => onSelect(item.id)}
              />
            );
          })}
        </nav>
      )}
      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-0 mt-1 w-full k-control-btn"
        >
          {expanded ? 'Show less' : `Load more (${hiddenCount})`}
        </button>
      ) : null}
    </>
  );

  if (bare) {
    return className ? <div className={className}>{nav}</div> : <>{nav}</>;
  }

  return (
    <SidebarSection title={title} icon={sectionIcon} className={className}>
      {nav}
    </SidebarSection>
  );
}
