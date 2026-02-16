'use client';

import Link from 'next/link';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { UnifiedStatusBox } from './UnifiedStatusBox';

export function RewardsCalculatorSidebar() {
  return (
    <UnifiedSidebar
      storageKeyPrefix="rewards-calc"
      header={(onHide) => (
        <SidebarHeader backHref="/" backLabel="Back to dApps" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
    >
      <UnifiedStatusBox />

      <SidebarSection title="Related">
        <nav className="space-y-0.5">
          <Link
            href="/points"
            className="k-sidebar-item w-full flex items-center gap-3"
          >
            <svg className="k-sidebar-icon w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Points & Perks</span>
          </Link>
          <Link
            href="/hub"
            className="k-sidebar-item w-full flex items-center gap-3"
          >
            <svg className="k-sidebar-icon w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Hub</span>
          </Link>
        </nav>
      </SidebarSection>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Adjust KAS amount, KREX tier, NFT ownership, and node status to see estimated GRID and XP rewards.
        </p>
      </div>
    </UnifiedSidebar>
  );
}
