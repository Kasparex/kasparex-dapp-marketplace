'use client';

import { useState, type ReactNode } from 'react';
import { SidebarSection } from './SidebarSection';
import { SidebarNavItem } from './SidebarNavItem';

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
}: SidebarCategoriesProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedSet = Array.isArray(selectedIds)
    ? new Set(selectedIds)
    : selectedIds != null
      ? new Set([selectedIds])
      : new Set<string>();

  const needsCollapse =
    collapsedItemCount != null && items.length > collapsedItemCount;
  const visibleItems =
    needsCollapse && !expanded ? items.slice(0, collapsedItemCount!) : items;
  const hiddenCount = needsCollapse ? items.length - collapsedItemCount! : 0;

  const nav = (
    <>
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
