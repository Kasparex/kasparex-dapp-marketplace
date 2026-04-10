'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';

export type DonationFilterStatus = 'all' | 'active' | 'ended';

const statusItems: { id: DonationFilterStatus; label: string }[] = [
  { id: 'all', label: 'All campaigns' },
  { id: 'active', label: 'Active' },
  { id: 'ended', label: 'Ended' },
];

type DonationsSidebarListingProps = {
  variant?: 'listing';
  selectedStatus: DonationFilterStatus;
  onStatusChange: (status: DonationFilterStatus) => void;
  statusCounts: { all: number; active: number; ended: number };
  backLink?: { href: string; label: string };
};

type DonationsSidebarMinimalProps = {
  variant: 'minimal';
  backLink?: { href: string; label: string };
};

export type DonationsSidebarProps = DonationsSidebarListingProps | DonationsSidebarMinimalProps;

export function DonationsSidebar(props: DonationsSidebarProps) {
  const pathname = usePathname();
  const isListing = props.variant !== 'minimal';
  const backLink = props.backLink ?? { href: '/hub', label: 'Back to Hub' };

  const header = (onHide: () => void) => (
    <SidebarHeader backHref={backLink.href} backLabel={backLink.label} onHide={onHide} />
  );

  const categoryItems = statusItems.map((s) => ({
    id: s.id,
    label: s.label,
    count: isListing ? props.statusCounts[s.id] ?? 0 : 0,
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  }));

  return (
    <UnifiedSidebar storageKeyPrefix="donations" header={header}>
      <div className="px-3 pt-3 pb-4 space-y-2 border-b border-zinc-200/70 dark:border-zinc-800/70 mb-4">
        {/* Primary CTA: Create stays visually prominent when not active (top slot). */}
        <Link
          href="/donations/studio#create"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/donations/studio')
              ? '!border-emerald-500/40 !bg-emerald-500/15 !text-emerald-800 dark:!text-emerald-300'
              : '!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300 hover:!bg-emerald-500/15'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Create campaign</span>
        </Link>

        {/* Secondary nav: neutral when inactive so it does not steal the primary CTA look. */}
        <Link
          href="/donations/dashboard"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/donations/dashboard')
              ? '!border-emerald-500/40 !bg-emerald-500/15 !text-emerald-800 dark:!text-emerald-300'
              : '!border-zinc-200 dark:!border-zinc-700 !bg-white dark:!bg-zinc-900 !text-zinc-700 dark:!text-zinc-200 hover:!bg-zinc-100 dark:hover:!bg-zinc-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5V15h4v6h5a1 1 0 001-1V10" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">My campaigns</span>
        </Link>

        <Link
          href="/donations/donors"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/donations/donors')
              ? '!border-emerald-500/40 !bg-emerald-500/15 !text-emerald-800 dark:!text-emerald-300'
              : '!border-zinc-200 dark:!border-zinc-700 !bg-white dark:!bg-zinc-900 !text-zinc-700 dark:!text-zinc-200 hover:!bg-zinc-100 dark:hover:!bg-zinc-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">For donors</span>
        </Link>

        <Link
          href="/donations/modules"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/donations/modules')
              ? '!border-emerald-500/40 !bg-emerald-500/15 !text-emerald-800 dark:!text-emerald-300'
              : '!border-zinc-200 dark:!border-zinc-700 !bg-white dark:!bg-zinc-900 !text-zinc-700 dark:!text-zinc-200 hover:!bg-zinc-100 dark:hover:!bg-zinc-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Modules</span>
        </Link>
      </div>

      {isListing && (
        <SidebarSection title="Filter by status">
          <SidebarCategories
            title=""
            items={categoryItems}
            selectedIds={[props.selectedStatus]}
            onSelect={(id) => props.onStatusChange(id as DonationFilterStatus)}
            multi={false}
          />
        </SidebarSection>
      )}
    </UnifiedSidebar>
  );
}
