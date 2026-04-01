import { NextRequest, NextResponse } from 'next/server';
import type { SeasonId } from '@/lib/leaderboard/seasons';
import { finalizeSeasonSnapshot, seasonToFinalize } from '@/lib/leaderboard/finalize';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CHRONICLES_LEADERBOARD_CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const querySecret = (req.nextUrl.searchParams.get('secret') ?? '').trim();
  return bearer === secret || querySecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const season = ((req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId) || seasonToFinalize(now);
  const result = await finalizeSeasonSnapshot(season, now);
  return NextResponse.json({ ok: true, season, ...result });
}
