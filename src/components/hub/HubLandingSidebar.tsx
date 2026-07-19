'use client';

import { useState, type ReactNode } from 'react';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { HubOnboardingWizard } from '@/components/hub/HubOnboardingWizard';

function IconWelcome({ className = 'w-4 h-4 k-sidebar-icon' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconProjects({ className = 'w-4 h-4 k-sidebar-icon' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconEcosystem({ className = 'w-4 h-4 k-sidebar-icon' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function IconFeatures({ className = 'w-4 h-4 k-sidebar-icon' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function IconBenefits({ className = 'w-4 h-4 k-sidebar-icon' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function IconOnboard({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

const HUB_SECTIONS: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: '/hub#hub-welcome', label: 'Welcome', icon: <IconWelcome /> },
  { href: '/hub#hub-projects', label: 'Projects', icon: <IconProjects /> },
  { href: '/hub#hub-ecosystem', label: 'Ecosystem', icon: <IconEcosystem /> },
  { href: '/hub#hub-features', label: 'Key features', icon: <IconFeatures /> },
  { href: '/hub#hub-benefits', label: 'Benefits & rewards', icon: <IconBenefits /> },
];

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function HubLandingSidebar() {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <>
      <UnifiedSidebar
        storageKeyPrefix="hub-landing"
        header={(onHide) => (
          <SidebarHeader backHref="/" backLabel="Home" onHide={onHide} className="bg-white dark:bg-zinc-950" />
        )}
        defaultWidth={292}
      >
        <div className="mb-4 px-1">
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="k-control-btn w-full justify-center gap-2"
          >
            <IconOnboard className="w-4 h-4 shrink-0" />
            Quick onboarding
          </button>
        </div>

        <SidebarSection title="On this page">
          <nav className="space-y-0.5">
            {HUB_SECTIONS.map((section) => {
              const anchorId = section.href.split('#')[1] ?? '';
              return (
                <SidebarNavItem
                  key={section.href}
                  href={section.href}
                  label={section.label}
                  icon={section.icon}
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

      <HubOnboardingWizard isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </>
  );
}
