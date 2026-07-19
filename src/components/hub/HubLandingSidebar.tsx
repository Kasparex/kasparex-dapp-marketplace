'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

const sectionIcon = (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const HUB_SECTIONS = [
  { href: '/hub#hub-welcome', label: 'Welcome' },
  { href: '/hub#hub-projects', label: 'Projects' },
  { href: '/hub#hub-ecosystem', label: 'Ecosystem' },
  { href: '/hub#hub-features', label: 'Key features' },
  { href: '/hub#hub-benefits', label: 'Benefits & rewards' },
] as const;

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function HubLandingSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="hub-landing"
      header={(onHide) => (
        <SidebarHeader backHref="/" backLabel="Home" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={292}
    >
      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          {HUB_SECTIONS.map((section) => {
            const anchorId = section.href.split('#')[1] ?? '';
            return (
              <SidebarNavItem
                key={section.href}
                href={section.href}
                label={section.label}
                icon={sectionIcon}
                onLinkClick={(e) => {
                  e.preventDefault();
                  scrollToAnchor(anchorId);
                  window.history.replaceState(null, '', section.href);
                }}
              />
            );
          })}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
