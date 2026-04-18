'use client';

import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { PROTOCOL_FAMILIES } from '@/lib/protocolFamilies';

const bookIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const gridIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const protocolIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export function ProtocolsIndexSidebar() {
  const pathname = usePathname();
  const backHref = pathname?.startsWith('/protocols/') && pathname !== '/protocols' ? '/protocols' : '/dapps';
  const backLabel = pathname === '/protocols' ? 'Back to dApps' : 'Back to protocols';

  return (
    <UnifiedSidebar storageKeyPrefix="protocols-index" header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}>
      <SidebarSection title="Explore">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/knowledge-base" label="Knowledge Base" icon={bookIcon} />
          <SidebarNavItem href="/dapps" label="dApps marketplace" icon={gridIcon} />
        </nav>
      </SidebarSection>

      <SidebarSection title="Protocols">
        <nav className="space-y-0.5">
          {PROTOCOL_FAMILIES.map((f) => (
            <SidebarNavItem
              key={f.slug}
              href={`/protocols/${f.slug}`}
              label={f.shortLabel}
              icon={protocolIcon}
              count={f.status}
              active={pathname === `/protocols/${f.slug}`}
            />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
