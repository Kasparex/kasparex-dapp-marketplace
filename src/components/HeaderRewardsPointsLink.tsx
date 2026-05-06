'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';

/** Local ack: treat as "seen" when user opens /rewards */
const ACK_KEY_PREFIX = 'kasparex_header_redeem_pts_ack_v1';

function ackKey(addrNorm: string): string {
  return `${ACK_KEY_PREFIX}:${addrNorm.toLowerCase()}`;
}

export function HeaderRewardsPointsLink() {
  const pathname = usePathname();
  const { address: addr, totalRedeemable, lines, minecoreRefinement, ledgerNetRedeemable } = useRedeemablePointsBreakdown();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener('focus', bump);
    return () => window.removeEventListener('focus', bump);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !addr) return;
    const k = ackKey(addr);
    if (localStorage.getItem(k) === null) {
      localStorage.setItem(k, String(totalRedeemable));
    }
  }, [addr, totalRedeemable]);

  useEffect(() => {
    if (pathname.startsWith('/rewards') && addr) {
      localStorage.setItem(ackKey(addr), String(totalRedeemable));
    }
  }, [pathname, addr, totalRedeemable]);

  const hasNewPoints = useMemo(() => {
    if (!addr || typeof window === 'undefined') return false;
    const raw = localStorage.getItem(ackKey(addr));
    if (raw === null) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return totalRedeemable > last;
  }, [addr, totalRedeemable, tick]);

  function acknowledge() {
    if (!addr || typeof window === 'undefined') return;
    localStorage.setItem(ackKey(addr), String(totalRedeemable));
    setTick((n) => n + 1);
  }

  const tip =
    addr && lines.length > 0
      ? `Redeemable ${totalRedeemable.toLocaleString()} pts · ${lines.map((l) => `${l.label}: ${l.points.toLocaleString()}`).join(' · ')}`
      : 'Connect Kaspa to track redeemable pts across Kasparex Hub.';

  return (
    <div className="flex items-center gap-2 flex-shrink-0 sm:gap-3">
      {addr ? (
        <span
          className="tabular-nums text-sm sm:text-[15px] font-medium text-zinc-900 dark:text-zinc-100 min-w-[4ch] sm:min-w-[5ch] text-right tracking-tight"
          title={tip}
        >
          {totalRedeemable.toLocaleString()}
        </span>
      ) : null}
      <Link
        href="/rewards"
        onClick={acknowledge}
        className="relative p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        aria-label="Rewards"
        title={
          addr
            ? `${totalRedeemable.toLocaleString()} redeemable pts · Gameplay ${minecoreRefinement.toLocaleString()} · Rewards wallet ${ledgerNetRedeemable.toLocaleString()}`
            : 'Rewards'
        }
      >
        <svg
          className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m-8.25 3.75h16.5m-9-3.75v9" />
        </svg>
        {hasNewPoints ? (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-[#02abb8] border-2 border-white dark:border-zinc-950" />
        ) : null}
      </Link>
    </div>
  );
}
