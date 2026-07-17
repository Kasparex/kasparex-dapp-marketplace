'use client';

import { useDAppDetailNavOptional } from '@/lib/dapps/DAppDetailNavContext';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

/**
 * Left-sidebar tab switcher for the current dApp (standard sidebar nav chrome).
 */
export function DAppSidebarTabNav() {
  const nav = useDAppDetailNavOptional();
  if (!nav || nav.tabs.length === 0) return null;

  return (
    <SidebarSection title="Navigate">
      <nav className="space-y-1" aria-label="dApp sections">
        {nav.tabs.map((tab) => (
          <SidebarNavItem
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={nav.currentTab === tab.id}
            onClick={() => nav.setTab(tab.id)}
          >
            {tab.rightAdornment ? (
              <span className="shrink-0 inline-flex items-center">{tab.rightAdornment}</span>
            ) : null}
          </SidebarNavItem>
        ))}
      </nav>
    </SidebarSection>
  );
}
