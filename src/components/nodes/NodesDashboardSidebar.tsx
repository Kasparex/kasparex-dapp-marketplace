'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';

const NODES_SECTIONS = [
  { id: 'connect-register', label: 'Connect & Register' },
  { id: 'node-type', label: 'Node Type' },
  { id: 'status-parameters', label: 'Status & Parameters' },
  { id: 'technical-requirements', label: 'Technical Requirements' },
  { id: 'incentives-earnings', label: 'Incentives & Earnings' },
] as const;

export function NodesDashboardSidebar() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="nodes-dashboard"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
      defaultWidth={256}
    >
      <SidebarSection title="Dashboard">
        <nav className="space-y-1">
          {NODES_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="k-sidebar-item w-full text-left"
            >
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
