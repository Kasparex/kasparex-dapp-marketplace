import { NextRequest, NextResponse } from 'next/server';
import { computeChroniclesLeaderboard } from '@/lib/chronicles/leaderboard/compute';

let cache: { atMs: number; rows: unknown[] } | null = null;

export async function GET(req: NextRequest) {
  const limit = Math.max(1, Math.min(300, Number(req.nextUrl.searchParams.get('limit') ?? '20') || 20));
  const now = Date.now();

  // Small in-memory cache to avoid recomputing on rapid reloads.
  if (cache && now - cache.atMs < 20_000) {
    return NextResponse.json({ ok: true, rows: (cache.rows as any[]).slice(0, limit), cached: true });
  }

  const rows = await computeChroniclesLeaderboard({ limit: 2000 });
  cache = { atMs: now, rows };
  return NextResponse.json({ ok: true, rows: rows.slice(0, limit), cached: false });
}

