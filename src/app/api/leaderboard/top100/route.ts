import { NextRequest, NextResponse } from 'next/server';
import type { GlobalTop100Snapshot } from '@/lib/leaderboard/top100';
import type { SeasonId } from '@/lib/leaderboard/seasons';

export async function GET(req: NextRequest) {
  const season = (req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId;
  if (!season) {
    return NextResponse.json({ ok: false, error: 'Missing season.' }, { status: 400 });
  }

  // Placeholder (Phase 1): wire to KV snapshot when available.
  const snapshot: GlobalTop100Snapshot = {
    seasonId: season,
    updatedAtMs: Date.now(),
    items: [],
  };

  return NextResponse.json({ ok: true, snapshot, note: 'Snapshot source not configured yet.' });
}

