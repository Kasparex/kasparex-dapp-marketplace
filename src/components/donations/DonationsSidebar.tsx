'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

export type DonationFilterStatus = 'all' | 'active' | 'ended' | 'goal_reached';

const SIDEBAR_BTN_ICON = 'w-4 h-4 shrink-0 text-zinc-800 dark:text-zinc-200';
const SIDEBAR_BTN_ICON_ACTIVE = `${SIDEBAR_BTN_ICON} !text-white`;

const ACTIVE_BTN =
  '!border-emerald-500/40 !bg-emerald-500/15 !text-emerald-800 dark:!text-emerald-300';

const statusItems: { id: DonationFilterStatus; label: string; icon: ReactNode }[] = [
  {
    id: 'all',
    label: 'All campaigns',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'active',
    label: 'Active',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'ended',
    label: 'Ended',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'goal_reached',
    label: 'Goal reached',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

type DonationsSidebarListingProps = {
  variant?: 'listing';
  selectedStatus: DonationFilterStatus;
  onStatusChange: (status: DonationFilterStatus) => void;
  statusCounts: { all: number; active: number; ended: number; goal_reached: number };
  backLink?: { href: string; label: string };
};

type DonationsSidebarMinimalProps = {
  variant: 'minimal';
  backLink?: { href: string; label: string };
  /** In-page anchors (same pattern as vBlog article sidebar). */
  sectionNavItems?: Array<{ id: string; label: string; icon?: ReactNode }>;
};

export type DonationsSidebarProps = DonationsSidebarListingProps | DonationsSidebarMinimalProps;

export function DonationsSidebar(props: DonationsSidebarProps) {
  const pathname = usePathname();
  const isListing = props.variant !== 'minimal';
  const backLink = props.backLink ?? { href: '/hub', label: 'Back to Hub' };
  const sectionNavItems = props.variant === 'minimal' ? props.sectionNavItems ?? [] : [];

  const createActive = pathname.startsWith('/donations/studio');
  const myCampaignsActive = pathname.startsWith('/donations/dashboard');

  const header = (onHide: () => void) => (
    <SidebarHeader backHref={backLink.href} backLabel={backLink.label} onHide={onHide} />
  );

  const categoryItems = statusItems.map((s) => ({
    id: s.id,
    label: s.label,
    count: isListing ? props.statusCounts[s.id] ?? 0 : 0,
    icon: s.icon,
  }));

  return (
    <UnifiedSidebar storageKeyPrefix="donations" header={header}>
      <div className="mb-6 space-y-2">
        <Link
          href="/donations/studio#create"
          className={`k-control-btn w-full justify-center gap-2 ${createActive ? ACTIVE_BTN : ''}`}
        >
          <svg className={createActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create campaign
        </Link>

        <Link
          href="/donations/dashboard"
          className={`k-control-btn w-full justify-center gap-2 ${myCampaignsActive ? ACTIVE_BTN : ''}`}
        >
          <svg className={myCampaignsActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5V15h4v6h5a1 1 0 001-1V10" />
          </svg>
          My campaigns
        </Link>
      </div>

      {sectionNavItems.length > 0 && (
        <SidebarSection title="On this page">
          <nav className="space-y-0.5">
            {sectionNavItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                href={`#${item.id}`}
                label={item.label}
                icon={
                  item.icon ?? (
                    <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
                    </svg>
                  )
                }
              />
            ))}
          </nav>
        </SidebarSection>
      )}

      {isListing && (
        <SidebarSection title="Filter by status">
          <SidebarCategories
            bare
            items={categoryItems}
            selectedIds={[props.selectedStatus]}
            onSelect={(id) => props.onStatusChange(id as DonationFilterStatus)}
            multi={false}
            collapsedItemCount={5}
          />
        </SidebarSection>
      )}
    </UnifiedSidebar>
  );
}
