'use client';

import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { RewardsHubQuickLinks } from '@/components/rewards/RewardsHubQuickLinks';

const sectionIcon = (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

export function LeaderboardSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="leaderboard"
      header={(onHide) => (
        <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={292}
    >
      <RewardsHubQuickLinks />

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/leaderboard#season-progress" label="Season progress" icon={sectionIcon} />
          <SidebarNavItem href="/leaderboard#global-top-100" label="Global Top 100" icon={sectionIcon} />
          <SidebarNavItem href="/leaderboard#projected-rewards" label="Projected rewards" icon={sectionIcon} />
          <SidebarNavItem href="/leaderboard#leaderboard-table" label="Leaderboard table" icon={sectionIcon} />
          <SidebarNavItem href="/leaderboard#how-leaderboard-works" label="How it works" icon={sectionIcon} />
          <SidebarNavItem
            href="/chronicles/dashboard"
            label="Vault & unlocks"
            icon={
              <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.343-6 3v6c0 1.657 2.686 3 6 3s6-1.343 6-3v-6c0-1.657-2.686-3-6-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11c0 1.657 2.686 3 6 3s6-1.343 6-3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8V6a3 3 0 116 0v2" />
              </svg>
            }
          />
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
