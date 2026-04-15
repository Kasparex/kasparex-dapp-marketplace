import type { NextRequest } from 'next/server';
import { kvIncr } from './kvRest';
import { usageMinuteBucketKey } from './keys';
import { toIsoMinuteUtc } from './time';

function sampleRate(): number {
  const raw = process.env.USAGE_METRICS_SAMPLE_RATE?.trim();
  const n = raw ? Number(raw) : 0.1;
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function dimFromPath(pathname: string): string {
  if (pathname === '/api/leaderboard/finalize') return 'api.leaderboard.finalize';
  if (pathname === '/api/updates') return 'api.updates';
  if (pathname.startsWith('/api/leaderboard/')) return 'api.leaderboard.other';
  if (pathname.startsWith('/api/kaspa/')) return 'api.kaspa';
  if (pathname.startsWith('/api/')) return 'api.other';
  return 'other';
}

export async function recordEdgeHit(request: NextRequest): Promise<void> {
  const r = sampleRate();
  if (r <= 0) return;
  if (r < 1 && Math.random() > r) return;

  const pathname = request.nextUrl.pathname;
  const minute = toIsoMinuteUtc();
  const dim = dimFromPath(pathname);
  const ttlSeconds = 6 * 60 * 60; // keep 6h of buckets

  // Store sampled counts; dashboard will scale by 1/r.
  await kvIncr(usageMinuteBucketKey(minute, `${dim}:count:s${r}`), ttlSeconds);
}

