'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import type { ProtocolFamilySlug } from '@/lib/protocolFamilies';

const NAV: Array<{ id: string; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'tools', label: 'Tools' },
  { id: 'apis', label: 'APIs' },
  { id: 'use-cases', label: 'Use cases' },
  { id: 'docs', label: 'Docs' },
];

export function ProtocolFamilySidebar({ slug, name }: { slug: ProtocolFamilySlug; name: string }) {
  return (
    <UnifiedSidebar
      storageKeyPrefix={`protocol-${slug}`}
      header={(onHide) => <SidebarHeader backHref="/protocols" backLabel="All protocols" onHide={onHide} />}
    >
      <SidebarSection title="Protocol">
        <p className="px-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{name}</p>
      </SidebarSection>

      <SidebarSection title="Page navigation">
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <SidebarNavItem
              key={item.id}
              href={`#${item.id}`}
              label={item.label}
              icon={
                <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
                </svg>
              }
            />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
