import { NextRequest, NextResponse } from 'next/server';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { computeGlobalLeaderboard } from '@/lib/leaderboard/computeGlobalLeaderboard';
import type { SeasonId } from '@/lib/leaderboard/seasons';

// Small in-memory cache per (season,address) to avoid re-scanning frequently.
const cache = new Map<string, { atMs: number; totalScore: number }>();

function cacheKey(seasonId: SeasonId, address: string) {
  return `${seasonId}:${address.toLowerCase()}`;
}

export async function GET(req: NextRequest) {
  const seasonId = (req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId;
  const rawAddress = (req.nextUrl.searchParams.get('address') ?? '').trim();
  if (!seasonId) {
    return NextResponse.json({ ok: false, error: 'Missing season.' }, { status: 400 });
  }
  if (!rawAddress) {
    return NextResponse.json({ ok: false, error: 'Missing address.' }, { status: 400 });
  }

  let address = rawAddress;
  try {
    address = normalizeKaspaAddress(rawAddress);
  } catch {
    // keep as-is
  }

  const now = Date.now();
  const key = cacheKey(seasonId, address);
  const hit = cache.get(key);
  if (hit && now - hit.atMs < 20_000) {
    return NextResponse.json({ ok: true, address, season: seasonId, totalScore: hit.totalScore, cached: true });
  }

  // Reuse the existing scoring logic; computeGlobalLeaderboard already normalizes and applies season window.
  // This is heavier than a dedicated per-wallet scan, but it matches the leaderboard table exactly and is cached.
  const rows = await computeGlobalLeaderboard({ limit: 2000, seasonId });
  const match = rows.find((r) => r.wallet.toLowerCase() === address.toLowerCase());
  const totalScore = match?.totalScore ?? 0;

  cache.set(key, { atMs: now, totalScore });
  return NextResponse.json({ ok: true, address, season: seasonId, totalScore, cached: false });
}

