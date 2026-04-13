'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { getChroniclesLocalSeasonSnapshot } from '@/lib/chronicles/leaderboard/localState';
import { scoreChroniclesSeason } from '@/lib/leaderboard/scoring';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

function ackKey(seasonId: string, addr: string): string {
  return `kasparex_lb_pts_ack_v1:${seasonId}:${addr.toLowerCase()}`;
}

export function HeaderLeaderboardLink() {
  const pathname = usePathname();
  const { state } = useKaspaWallet();
  const addr = state.address ? normAddr(state.address) : '';
  const [tick, setTick] = useState(0);
  /** Recompute season on tick so month boundaries match leaderboard / season card. */
  const season = useMemo(() => currentSeasonWindowUtc(), [tick]);

  const currentPoints = useMemo(() => {
    if (!addr) return 0;
    const snap = getChroniclesLocalSeasonSnapshot(addr, season.id);
    return scoreChroniclesSeason(snap).totalPoints ?? 0;
  }, [addr, season.id, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    const onFocus = () => setTick((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !addr) return;
    const k = ackKey(season.id, addr);
    if (localStorage.getItem(k) === null) {
      localStorage.setItem(k, String(currentPoints));
    }
  }, [addr, season.id, currentPoints]);

  useEffect(() => {
    if (pathname.startsWith('/leaderboard') && addr) {
      const k = ackKey(season.id, addr);
      localStorage.setItem(k, String(currentPoints));
    }
  }, [pathname, addr, season.id, currentPoints]);

  const hasNewPoints = useMemo(() => {
    if (!addr || typeof window === 'undefined') return false;
    const raw = localStorage.getItem(ackKey(season.id, addr));
    if (raw === null) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return currentPoints > last;
  }, [addr, season.id, currentPoints, tick]);

  function acknowledge() {
    if (!addr || typeof window === 'undefined') return;
    localStorage.setItem(ackKey(season.id, addr), String(currentPoints));
    setTick((n) => n + 1);
  }

  const displayPoints = addr ? currentPoints : 0;

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
      <span
        className="tabular-nums text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 min-w-[2ch] text-right tracking-tight"
        title="Season points (same local snapshot as Leaderboard → Your season progress)"
      >
        {displayPoints.toLocaleString()}
      </span>
      <Link
        href="/leaderboard"
        onClick={acknowledge}
        className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        aria-label="Leaderboard"
        title="Leaderboard"
      >
        <svg
          className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 21h8m-4 0v-4m6-14h2a2 2 0 012 2v1a6 6 0 01-6 6M6 3H4a2 2 0 00-2 2v1a6 6 0 006 6m10-9H6v5a6 6 0 006 6 6 6 0 006-6V3z"
          />
        </svg>
        {hasNewPoints ? (
          <span className="absolute top-1 right-1 h-2 w-2 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
        ) : null}
      </Link>
    </div>
  );
}
