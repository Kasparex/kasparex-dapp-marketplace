import { NextRequest, NextResponse } from 'next/server';
import type { SeasonId } from '@/lib/leaderboard/seasons';
import { getSeasonMeta, getTop100Snapshot } from '@/lib/leaderboard/snapshotStore';

export async function GET(req: NextRequest) {
  const season = (req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId;
  if (!season) {
    return NextResponse.json({ ok: false, error: 'Missing season.' }, { status: 400 });
  }

  const [snapshot, meta] = await Promise.all([getTop100Snapshot(season), getSeasonMeta(season)]);
  return NextResponse.json({ ok: true, snapshot: snapshot ?? null, seasonMeta: meta ?? null });
}

