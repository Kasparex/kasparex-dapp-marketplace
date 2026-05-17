'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navBtnText = 'text-sm font-semibold tracking-tight';

const quickInactive =
  '!border-amber-500/30 !bg-amber-500/10 !text-amber-800 dark:!text-amber-300 hover:!bg-amber-500/15';
const quickActive =
  '!border-amber-500/40 !bg-amber-500/15 !text-amber-800 dark:!text-amber-300';

/** Shared Rewards hub rail links (Rewards, Tiers, Leaderboard layouts). */
export function RewardsHubQuickLinks() {
  const pathname = usePathname() ?? '';

  const lb = pathname.startsWith('/leaderboard');
  const rw = pathname === '/rewards';
  const tr = pathname.startsWith('/tiers');
  const calc = pathname.startsWith('/rewards-calculator');

  return (
    <div className="mb-4 space-y-2 border-b border-zinc-200/70 px-3 pb-4 pt-3 dark:border-zinc-800/70">
      <Link
        href="/leaderboard"
        className={`k-control-btn w-full justify-center gap-2 ${lb ? quickActive : quickInactive}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 21h8m-4 0v-4m6-14h2a2 2 0 012 2v1a6 6 0 01-6 6M6 3H4a2 2 0 00-2 2v1a6 6 0 006 6m10-9H6v5a6 6 0 006 6 6 6 0 006-6V3z"
          />
        </svg>
        <span className={navBtnText}>Leaderboard</span>
      </Link>

      <Link
        href="/rewards"
        className={`k-control-btn w-full justify-center gap-2 ${rw ? quickActive : quickInactive}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
        <span className={navBtnText}>Rewards</span>
      </Link>

      <Link href="/tiers" className={`k-control-btn w-full justify-center gap-2 ${tr ? quickActive : quickInactive}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className={navBtnText}>Tiers</span>
      </Link>

      <Link
        href="/rewards-calculator"
        className={`k-control-btn w-full justify-center gap-2 ${calc ? quickActive : quickInactive}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span className={navBtnText}>Calculator</span>
      </Link>
    </div>
  );
}
