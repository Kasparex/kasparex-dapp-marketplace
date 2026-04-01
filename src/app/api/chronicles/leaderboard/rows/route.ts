import { NextRequest, NextResponse } from 'next/server';
import { computeChroniclesLeaderboard } from '@/lib/chronicles/leaderboard/compute';
import type { SeasonId } from '@/lib/leaderboard/seasons';

let cache: { atMs: number; seasonId: SeasonId; rows: unknown[] } | null = null;

export async function GET(req: NextRequest) {
  const limit = Math.max(1, Math.min(300, Number(req.nextUrl.searchParams.get('limit') ?? '20') || 20));
  const seasonId = (req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId;
  if (!seasonId) {
    return NextResponse.json({ ok: false, error: 'Missing season.' }, { status: 400 });
  }
  const now = Date.now();

  // Small in-memory cache to avoid recomputing on rapid reloads.
  if (cache && cache.seasonId === seasonId && now - cache.atMs < 20_000) {
    return NextResponse.json({ ok: true, rows: (cache.rows as any[]).slice(0, limit), cached: true });
  }

  const rows = await computeChroniclesLeaderboard({ limit: 2000, seasonId });
  cache = { atMs: now, seasonId, rows };
  return NextResponse.json({ ok: true, rows: rows.slice(0, limit), cached: false });
}

