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

const REWARD_SECTIONS = [
  {
    id: 'krex-tier-rewards',
    label: 'KREX Tier Rewards',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'nft-rewards',
    label: 'NFT Rewards',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 12V8a2 2 0 00-2-2h-4M4 12V8a2 2 0 012-2h4m10 12h-4m-8 0H4m0 0v-4m0 4v4a2 2 0 002 2h4m10-6v4a2 2 0 01-2 2h-4M12 6v12"
        />
      </svg>
    ),
  },
  {
    id: 'node-rewards',
    label: 'Node Rewards',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a4 4 0 014-4h8a4 4 0 014 4v10a4 4 0 01-4 4H8a4 4 0 01-4-4V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h8M8 12h8M8 16h6" />
      </svg>
    ),
  },
  {
    id: 'premium-features',
    label: 'Premium Features',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-3.314 0-6 1.343-6 3v6c0 1.657 2.686 3 6 3s6-1.343 6-3v-6c0-1.657-2.686-3-6-3z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11c0 1.657 2.686 3 6 3s6-1.343 6-3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8V6a3 3 0 116 0v2" />
      </svg>
    ),
  },
] as const;

/** Mirrors `/rewards` sidebar chrome; anchors point at Tiers page sections only. */
export function TiersSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="tiers"
      header={(onHide) => (
        <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={292}
    >
      <RewardsHubQuickLinks />

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/tiers#tiers-intro" label="Overview" icon={sectionIcon} />
          {REWARD_SECTIONS.map((section) => (
            <SidebarNavItem key={section.id} href={`/tiers#${section.id}`} label={section.label} icon={section.icon} />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
