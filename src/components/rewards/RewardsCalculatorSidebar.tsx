'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { UnifiedStatusBox } from './UnifiedStatusBox';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

const sectionIcon = (
  <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const navBtnText = 'text-sm font-semibold tracking-tight';

export function RewardsCalculatorSidebar() {
  const pathname = usePathname();

  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards-calc"
      header={(onHide) => (
        <SidebarHeader backHref="/leaderboard" backLabel="Back to Leaderboard" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
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
          <span className={navBtnText}>Leaderboard</span>
        </Link>

        <Link href="/rewards" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span className={navBtnText}>Rewards</span>
        </Link>

        <Link href="/tiers" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className={navBtnText}>Tiers</span>
        </Link>

        <Link href="/rewards-calculator" className="k-control-btn w-full justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className={navBtnText}>Calculator</span>
        </Link>
      </div>

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

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Adjust KAS amount, KREX tier, NFT ownership, and node status to see estimated GRID on L2. Kaspa hub redeemable pts live
          on the Rewards page Points tab.
        </p>
      </div>
    </UnifiedSidebar>
  );
}
