'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequestHost } from '@/components/CanonicalNavContext';
import { canonicalAppHref, segmentPathForHost } from '@/lib/config/sectionHosts';
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
  const requestHost = useRequestHost();
  const navPath = segmentPathForHost(pathname, requestHost ?? undefined);
  const leaderboardHref = canonicalAppHref('/leaderboard', requestHost ?? undefined);
  const { state } = useKaspaWallet();
  const addr = state.address ? normAddr(state.address) : '';
  const season = useMemo(() => currentSeasonWindowUtc(), []);
  const [tick, setTick] = useState(0);
  const [remotePoints, setRemotePoints] = useState<number | null>(null);

  const currentPoints = useMemo(() => {
    if (!addr) return 0;
    const snap = getChroniclesLocalSeasonSnapshot(addr, season.id);
    return scoreChroniclesSeason(snap).totalPoints ?? 0;
  }, [addr, season.id, tick]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!addr) {
        setRemotePoints(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/chronicles/leaderboard/score?season=${encodeURIComponent(season.id)}&address=${encodeURIComponent(addr)}`,
          { cache: 'no-store' }
        );
        const j = (await res.json()) as { ok?: boolean; totalScore?: number };
        if (cancelled) return;
        setRemotePoints(j.ok && typeof j.totalScore === 'number' ? j.totalScore : 0);
      } catch {
        if (!cancelled) setRemotePoints(null);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [addr, season.id, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 8000);
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
    if (navPath.startsWith('/leaderboard') && addr) {
      const k = ackKey(season.id, addr);
      localStorage.setItem(k, String(currentPoints));
    }
  }, [navPath, addr, season.id, currentPoints]);

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

  const displayPoints = addr ? (remotePoints ?? currentPoints) : 0;

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
      <span
        className="tabular-nums text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 min-w-[1.25rem] text-right"
        title="Season points (local wallet progress)"
      >
        {displayPoints.toLocaleString()}
      </span>
      <Link
        href={leaderboardHref}
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
