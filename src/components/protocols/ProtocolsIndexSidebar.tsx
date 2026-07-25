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

const protocolIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const toolsIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export function ProtocolsIndexSidebar() {
  const pathname = usePathname();
  const onListing = pathname === '/protocols';
  const backHref = onListing ? '/hub' : '/protocols';
  const backLabel = onListing ? 'Back to Hub' : 'Back to Protocols';

  return (
    <UnifiedSidebar storageKeyPrefix="protocols-index" header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}>
      <SidebarSection title="Explore">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/protocols" label="All protocols" icon={protocolIcon} active={onListing} />
          <SidebarNavItem href="/protocols/kpx-tools" label="KPX tools" icon={toolsIcon} active={pathname === '/protocols/kpx-tools'} />
          <SidebarNavItem href="/knowledge-base" label="Knowledge Base" icon={bookIcon} />
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
