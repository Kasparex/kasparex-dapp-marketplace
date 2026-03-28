'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { AdsAvailableSlotsMenu } from '@/components/ads/AdsAvailableSlotsMenu';

const overviewIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const listingIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export function AdsSidebar() {
  const pathname = usePathname();
  const isListing = pathname === '/ads';
  const isOverview = pathname === '/ads/overview';

  return (
    <UnifiedSidebar
      storageKeyPrefix="ads"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
    >
      <SidebarSection title="Kasparex Ads">
        <nav className="space-y-0.5">
          <Link href="/ads">
            <SidebarNavItem
              label="Active campaigns"
              icon={listingIcon}
              active={isListing}
            />
          </Link>
          <Link href="/ads/overview">
            <SidebarNavItem
              label="Overview"
              icon={overviewIcon}
              active={isOverview}
            />
          </Link>
        </nav>
      </SidebarSection>

      <SidebarSection title="Inventory">
        <AdsAvailableSlotsMenu />
      </SidebarSection>
    </UnifiedSidebar>
  );
}
