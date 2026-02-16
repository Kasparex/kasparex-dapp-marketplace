'use client';

import type { ReactNode } from 'react';
import { SidebarSection } from './SidebarSection';
import { SidebarNavItem } from './SidebarNavItem';

export interface QuickActionItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface SidebarQuickActionsProps {
  title?: string;
  sectionIcon?: ReactNode;
  items: QuickActionItem[];
  /** Pathname or id to mark active (optional). */
  activeId?: string;
  className?: string;
}

export function SidebarQuickActions({
  title = 'Quick Actions',
  sectionIcon,
  items,
  activeId,
  className = '',
}: SidebarQuickActionsProps) {
  if (items.length === 0) return null;
  return (
    <SidebarSection title={title} className={className}>
      <nav className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={activeId === item.id || activeId === item.href}
          />
        ))}
      </nav>
    </SidebarSection>
  );
}
