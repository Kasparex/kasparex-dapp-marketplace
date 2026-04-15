import { NextResponse } from 'next/server';

function getSecretOk(req: Request): boolean {
  const expected = process.env.INTERNAL_STATS_SECRET?.trim() ?? '';
  if (!expected) return false;
  const url = new URL(req.url);
  const q = (url.searchParams.get('secret') ?? '').trim();
  // Allow the secret either as query param or via cookie-less header for easy automation.
  const h = (req.headers.get('x-internal-stats-secret') ?? '').trim();
  return q === expected || h === expected;
}

function sampleRate(): number {
  const raw = process.env.USAGE_METRICS_SAMPLE_RATE?.trim();
  const n = raw ? Number(raw) : 0.1;
  if (!Number.isFinite(n) || n <= 0) return 0.1;
  if (n >= 1) return 1;
  return n;
}

export async function GET(req: Request) {
  if (!getSecretOk(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const workerBase = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL?.trim()?.replace(/\/$/, '');
  const secret = process.env.USAGE_WORKER_SECRET?.trim();
  if (!workerBase || !secret) {
    return NextResponse.json({ ok: false, error: 'Usage worker not configured' }, { status: 500 });
  }

  const sr = sampleRate();
  const url = new URL(`${workerBase}/kasparex/usage/snapshot`);
  url.searchParams.set('minutes', '60');
  url.searchParams.set('sampleRate', String(sr));

  const res = await fetch(url.toString(), {
    headers: { 'X-Usage-Secret': secret },
    cache: 'no-store',
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: `Worker error (${res.status})` }, { status: 502 });
  }
  const payload = await res.json();
  return NextResponse.json(payload);
}

