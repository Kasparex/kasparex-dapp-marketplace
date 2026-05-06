'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

interface RewardsDashboardSidebarProps {
  filters: {
    types: ('krex-tier' | 'nft' | 'node' | 'premium')[];
    status: ('unlocked' | 'locked')[];
  };
  searchQuery: string;
  onFilterChange: (filters: RewardsDashboardSidebarProps['filters']) => void;
  onSearchChange: (query: string) => void;
}

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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7a4 4 0 014-4h8a4 4 0 014 4v10a4 4 0 01-4 4H8a4 4 0 01-4-4V7z"
        />
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

export function RewardsDashboardSidebar({
  filters: _filters,
  searchQuery: _searchQuery,
  onFilterChange: _onFilterChange,
  onSearchChange: _onSearchChange,
}: RewardsDashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards-dashboard"
      header={(onHide) => (
        <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={256}
    >
      <div className="px-3 pt-3 pb-4 space-y-2 border-b border-zinc-200/70 dark:border-zinc-800/70 mb-4">
        <Link
          href="/leaderboard"
          className={`k-control-btn w-full justify-center gap-2 ${
            pathname.startsWith('/leaderboard')
              ? '!border-amber-500/40 !bg-amber-500/15 !text-amber-800 dark:!text-amber-300'
              : '!border-amber-500/30 !bg-amber-500/10 !text-amber-800 dark:!text-amber-300 hover:!bg-amber-500/15'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 21h8m-4 0v-4m6-14h2a2 2 0 012 2v1a6 6 0 01-6 6M6 3H4a2 2 0 00-2 2v1a6 6 0 006 6m10-9H6v5a6 6 0 006 6 6 6 0 006-6V3z"
            />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Leaderboard</span>
        </Link>
        <Link href="/rewards" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Rewards</span>
        </Link>
        <Link href="/rewards#rewards-points" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Points</span>
        </Link>
        <Link href="/tiers" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Tiers</span>
        </Link>
        <Link href="/rewards-calculator" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Calculator</span>
        </Link>
      </div>

      <SidebarSection title="On this page">
        <nav className="space-y-0.5">
          <SidebarNavItem href="/tiers#tiers-intro" label="Overview" icon={sectionIcon} />
          {REWARD_SECTIONS.map((section) => (
            <SidebarNavItem
              key={section.id}
              href={`/tiers#${section.id}`}
              label={section.label}
              icon={section.icon}
            />
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
