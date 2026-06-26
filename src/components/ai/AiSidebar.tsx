'use client';

import type { ReactNode } from 'react';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { SidebarQuickActions } from '@/components/sidebar/SidebarQuickActions';
import { AI_SIDEBAR_GROUPS } from '@/lib/ai/sidebarSections';
import type { AiHubSection } from '@/lib/ai/types';

export interface AiSidebarProps {
  activeSection: AiHubSection;
  onSectionChange: (section: AiHubSection) => void;
}

function sectionIcon(id: AiHubSection): ReactNode {
  const props = { className: 'w-4 h-4', fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  switch (id) {
    case 'agents':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'workflow-templates':
    case 'my-templates':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'mpcs':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'new-trending':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'marketplace':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'integrations':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    case 'community':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'documentation':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'developer-tools':
    case 'agent-sdk':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'agent-registry':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      );
    case 'l1-hooks':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    case 'announcements':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    default:
      return null;
  }
}

export function AiSidebar({ activeSection, onSectionChange }: AiSidebarProps) {
  const handleSectionClick = (id: AiHubSection) => {
    if (id === 'marketplace') return;
    if (id === 'documentation') return;
    onSectionChange(id);
  };

  return (
    <UnifiedSidebar
      storageKeyPrefix="kasparex-ai"
      header={(onHide) => <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />}
    >
      <SidebarQuickActions
        items={[
          {
            id: 'create',
            label: 'Create Agent',
            href: '/ai#create-agent',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ),
          },
          {
            id: 'workflows',
            label: 'Create Workflow',
            href: '/ai#create-workflow',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            ),
          },
        ]}
      />

      {AI_SIDEBAR_GROUPS.map((group) => (
        <SidebarSection key={group.title} title={group.title}>
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              if (item.id === 'marketplace') {
                return (
                  <SidebarNavItem
                    key={item.id}
                    href="/store"
                    label={item.label}
                    icon={sectionIcon(item.id)}
                  />
                );
              }
              if (item.id === 'documentation') {
                return (
                  <SidebarNavItem
                    key={item.id}
                    href="/knowledge-base"
                    label={item.label}
                    icon={sectionIcon(item.id)}
                  />
                );
              }
              return (
                <SidebarNavItem
                  key={item.id}
                  label={item.label}
                  icon={sectionIcon(item.id)}
                  active={activeSection === item.id}
                  count={item.badge}
                  onClick={() => handleSectionClick(item.id)}
                />
              );
            })}
          </nav>
        </SidebarSection>
      ))}
    </UnifiedSidebar>
  );
}
