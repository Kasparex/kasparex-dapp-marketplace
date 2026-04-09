'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';

export type DonationFilterStatus = 'all' | 'active' | 'ended';

interface DonationsSidebarProps {
  selectedStatus: DonationFilterStatus;
  onStatusChange: (status: DonationFilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  statusCounts: { all: number; active: number; ended: number };
  backLink?: { href: string; label: string };
}

const statusItems: { id: DonationFilterStatus; label: string }[] = [
  { id: 'all', label: 'All campaigns' },
  { id: 'active', label: 'Active' },
  { id: 'ended', label: 'Ended' },
];

export function DonationsSidebar({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onResetFilters,
  statusCounts,
  backLink = { href: '/hub', label: 'Back to Hub' },
}: DonationsSidebarProps) {
  const pathname = usePathname();
  const header = (onHide: () => void) => (
    <SidebarHeader backHref={backLink.href} backLabel={backLink.label} onHide={onHide} />
  );

  const categoryItems = statusItems.map((s) => ({
    id: s.id,
    label: s.label,
    count: statusCounts[s.id] ?? 0,
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  }));

  return (
    <UnifiedSidebar storageKeyPrefix="donations" header={header}>
      <div className="px-3 pt-3 pb-4 space-y-2 border-b border-zinc-200/70 dark:border-zinc-800/70 mb-4">
        <Link
          href="/donations/studio"
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

        <Link
          href="/donations/modules"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/donations/modules')
              ? '!border-cyan-500/40 !bg-cyan-500/15 !text-[#017a84] dark:!text-[#8ff1f8]'
              : '!border-cyan-500/30 !bg-cyan-500/10 !text-[#017a84] dark:!text-[#8ff1f8] hover:!bg-cyan-500/15'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 0c-3.866 0-7 3.134-7 7v3a2 2 0 002 2h10a2 2 0 002-2v-3c0-3.866-3.134-7-7-7z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Vaults & unlocks</span>
        </Link>
      </div>
      <SidebarSection title="Filter by status">
        <SidebarCategories
          title=""
          items={categoryItems}
          selectedIds={[selectedStatus]}
          onSelect={(id) => onStatusChange(id as DonationFilterStatus)}
          multi={false}
        />
      </SidebarSection>
      <SidebarSection title="Search">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          aria-label="Search campaigns"
        />
      </SidebarSection>
      <button type="button" onClick={onResetFilters} className="w-full mt-4 k-control-btn">
        Reset filters
      </button>
    </UnifiedSidebar>
  );
}
