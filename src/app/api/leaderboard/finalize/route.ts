import { NextRequest, NextResponse } from 'next/server';
import type { SeasonId } from '@/lib/leaderboard/seasons';
import { finalizeSeasonSnapshot, seasonToFinalize } from '@/lib/leaderboard/finalize';

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

  const workerBase = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL?.trim()?.replace(/\/$/, '');
  const workerSecret = process.env.USAGE_WORKER_SECRET?.trim();
  if (workerBase && workerSecret) {
    // Simple per-minute rate limit as a safety net (best-effort).
    try {
      const rl = new URL(`${workerBase}/kasparex/internal/ratelimit`);
      rl.searchParams.set('name', `leaderboard.finalize:${new Date().toISOString().slice(0, 16)}`);
      rl.searchParams.set('ttl', '120');
      rl.searchParams.set('limit', '5');
      const res = await fetch(rl.toString(), { method: 'POST', headers: { 'X-Usage-Secret': workerSecret }, cache: 'no-store' });
      const j = (await res.json().catch(() => null)) as any;
      if (res.ok && j && j.allowed === false) {
        return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
      }
    } catch {}

    // Prevent concurrent expensive executions (best-effort).
    try {
      const lock = new URL(`${workerBase}/kasparex/internal/lock`);
      lock.searchParams.set('name', 'cron:leaderboard.finalize:running');
      lock.searchParams.set('ttl', String(10 * 60));
      const res = await fetch(lock.toString(), { method: 'POST', headers: { 'X-Usage-Secret': workerSecret }, cache: 'no-store' });
      const j = (await res.json().catch(() => null)) as any;
      if (res.ok && j && j.acquired === false) {
        return NextResponse.json({ ok: true, published: false, reason: 'Finalize already running.' });
      }
    } catch {}
  }

  const now = Date.now();
  const season = ((req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId) || seasonToFinalize(now);
  const result = await finalizeSeasonSnapshot(season, now);
  return NextResponse.json({ season, ...result });
}
