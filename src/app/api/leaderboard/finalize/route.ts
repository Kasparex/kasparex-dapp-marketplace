import { NextRequest, NextResponse } from 'next/server';
import type { SeasonId } from '@/lib/leaderboard/seasons';
import { finalizeSeasonSnapshot, seasonToFinalize } from '@/lib/leaderboard/finalize';
import { kvIncr, kvGet, kvSet } from '@/lib/usage/kvRest';
import { usageLockKey } from '@/lib/usage/keys';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CHRONICLES_LEADERBOARD_CRON_SECRET?.trim();
  // Fail closed in production so a missing env var cannot expose an expensive endpoint.
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const querySecret = (req.nextUrl.searchParams.get('secret') ?? '').trim();
  return bearer === secret || querySecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Simple per-minute rate limit as a safety net (best-effort).
  try {
    const minuteKey = usageLockKey(`rl:leaderboard.finalize:${new Date().toISOString().slice(0, 16)}`);
    const n = await kvIncr(minuteKey, 120);
    if (typeof n === 'number' && n > 5) {
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
    }
  } catch {}

  // Prevent concurrent expensive executions (best-effort).
  const lockKey = usageLockKey('cron:leaderboard.finalize:running');
  try {
    const existing = await kvGet<{ startedAtMs: number }>(lockKey);
    if (existing?.startedAtMs && Date.now() - existing.startedAtMs < 10 * 60 * 1000) {
      return NextResponse.json({ ok: true, published: false, reason: 'Finalize already running.' });
    }
    await kvSet(lockKey, { startedAtMs: Date.now() }, 10 * 60);
  } catch {}

  const now = Date.now();
  const season = ((req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId) || seasonToFinalize(now);
  try {
    const result = await finalizeSeasonSnapshot(season, now);
    return NextResponse.json({ season, ...result });
  } finally {
    // Release lock early (best-effort). TTL will also expire it.
    try {
      await kvSet(lockKey, null, 1);
    } catch {}
  }
}
