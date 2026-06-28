import type { NextRequest } from 'next/server';
import { toIsoMinuteUtc } from './time';

function sampleRate(): number {
  const raw = process.env.USAGE_METRICS_SAMPLE_RATE?.trim();
  const n = raw ? Number(raw) : 0.1;
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function dimFromPath(pathname: string): string {
  if (pathname === '/api/updates') return 'api.updates';
  if (pathname.startsWith('/api/kaspa/')) return 'api.kaspa';
  if (pathname.startsWith('/api/')) return 'api.other';
  return 'other';
}

export async function recordEdgeHit(request: NextRequest): Promise<void> {
  const r = sampleRate();
  if (r <= 0) return;
  if (r < 1 && Math.random() > r) return;

  const baseUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL?.trim();
  const secret = process.env.USAGE_WORKER_SECRET?.trim();
  if (!baseUrl || !secret) return;

  const pathname = request.nextUrl.pathname;
  const minute = toIsoMinuteUtc();
  const dim = dimFromPath(pathname);
  await fetch(`${baseUrl.replace(/\/$/, '')}/kasparex/usage/hit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Usage-Secret': secret,
    },
    body: JSON.stringify({ minute, dim, sampleRate: r }),
    cache: 'no-store',
  });
}

