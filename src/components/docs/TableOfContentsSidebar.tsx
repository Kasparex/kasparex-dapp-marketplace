'use client';

import { useEffect, useState } from 'react';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

export interface TableOfContentsSidebarProps {
  items: Array<{
    id: string;
    title: string;
  }>;
  /** Prefix for UnifiedSidebar localStorage keys (avoid collisions across pages). */
  storageKeyPrefix?: string;
  backHref?: string;
  backLabel?: string;
  /** Show a Knowledge Base shortcut above the TOC (standard hub pattern). */
  showKnowledgeBaseLink?: boolean;
}

const listIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
  </svg>
);

const bookIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export function TableOfContentsSidebar({
  items,
  storageKeyPrefix = 'docs-toc',
  backHref = '/dapps',
  backLabel = 'Back to dApps',
  showKnowledgeBaseLink = true,
}: TableOfContentsSidebarProps) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = items.map((item) => {
        const element = document.getElementById(item.id);
        return { id: item.id, top: element?.getBoundingClientRect().top ?? 0 };
      });
      const current = sections.filter((s) => s.top <= 120).sort((a, b) => b.top - a.top)[0];
      if (current) setActiveId(current.id);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        window.history.replaceState(null, '', `#${id}`);
      } catch {
        // ignore
      }
    }
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix={storageKeyPrefix}
      header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}
      defaultWidth={280}
    >
      {showKnowledgeBaseLink ? (
        <SidebarSection title="Explore">
          <nav className="space-y-0.5">
            <SidebarNavItem href="/knowledge-base" label="Knowledge Base" icon={bookIcon} />
          </nav>
        </SidebarSection>
      ) : null}

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          {items.map((item) => (
            <SidebarNavItem
              key={item.id}
              href={`#${item.id}`}
              label={item.title}
              icon={listIcon}
              active={activeId === item.id}
              onLinkClick={(e) => {
                e.preventDefault();
                scrollTo(item.id);
              }}
            />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
