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

export function RewardsSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards"
      header={(onHide) => (
        <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={292}
    >
      <RewardsHubQuickLinks />

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/rewards#rewards-intro" label="Overview" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#rewards-l2-gate" label="Verify L2 wallet" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#rewards-catalog" label="Catalog & filters" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#rewards-points" label="Earn pts" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#module-scoring-rules" label="Module scoring rules" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#nft-slot-points" label="NFT slot points" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#rewards-history" label="History" icon={sectionIcon} />
          <SidebarNavItem href="/rewards#rewards-balances" label="Balances" icon={sectionIcon} />
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
