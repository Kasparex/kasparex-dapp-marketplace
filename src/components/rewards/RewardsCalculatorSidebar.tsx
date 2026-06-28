'use client';

import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { UnifiedStatusBox } from './UnifiedStatusBox';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';
import { RewardsHubQuickLinks } from '@/components/rewards/RewardsHubQuickLinks';

const sectionIcon = (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

export function RewardsCalculatorSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards-calc"
      header={(onHide) => (
        <SidebarHeader backHref="/rewards" backLabel="Back to Rewards" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={292}
    >
      <RewardsHubQuickLinks />

      <UnifiedStatusBox />

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/rewards-calculator#reward-calculator" label="Simulator" icon={sectionIcon} />
          <SidebarNavItem
            href="/hub"
            label="Hub"
            icon={
              <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />
        </nav>
      </SidebarSection>

      <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Adjust KAS amount, KREX tier, NFT ownership, and node status to see estimated GRID on L2. Kaspa hub redeemable pts live
          on the Rewards page Points tab.
        </p>
      </div>
    </UnifiedSidebar>
  );
}
