'use client';

import type { ReactNode } from 'react';
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
}

export function SidebarCategories({
  title = 'Categories',
  sectionIcon,
  items,
  selectedIds,
  onSelect,
  multi = true,
  className = '',
}: SidebarCategoriesProps) {
  const selectedSet = Array.isArray(selectedIds)
    ? new Set(selectedIds)
    : selectedIds != null
      ? new Set([selectedIds])
      : new Set<string>();

  return (
    <SidebarSection title={title} icon={sectionIcon} className={className}>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isChecked = selectedSet.has(item.id);
          // Always use onClick/active pattern, never checkboxes
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
    </SidebarSection>
  );
}
