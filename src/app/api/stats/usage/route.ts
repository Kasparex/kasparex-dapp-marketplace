import { NextResponse } from 'next/server';
import { kvMGet } from '@/lib/usage/kvRest';
import { usageMinuteBucketKey } from '@/lib/usage/keys';
import { toIsoMinuteUtc } from '@/lib/usage/time';

type Dim = { id: string; label: string };

const DIMENSIONS: Dim[] = [
  { id: 'api.leaderboard.finalize', label: 'Leaderboard finalize (cron)' },
  { id: 'api.updates', label: 'Updates feed' },
  { id: 'api.leaderboard.other', label: 'Leaderboard other' },
  { id: 'api.kaspa', label: 'Kaspa API' },
  { id: 'api.other', label: 'Other API' },
];

function getSecretOk(req: Request): boolean {
  const expected = process.env.INTERNAL_STATS_SECRET?.trim() ?? '';
  if (!expected) return false;
  const url = new URL(req.url);
  const q = (url.searchParams.get('secret') ?? '').trim();
  // Allow the secret either as query param or via cookie-less header for easy automation.
  const h = (req.headers.get('x-internal-stats-secret') ?? '').trim();
  return q === expected || h === expected;
}

function minutesBack(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  // Start from current minute (rounded down)
  now.setUTCSeconds(0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60_000);
    out.push(toIsoMinuteUtc(t.getTime()));
  }
  return out;
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

  const sr = sampleRate();
  const minutes = minutesBack(60);
  const series: Record<string, number[]> = {};
  const totals: Record<string, number> = {};
  const last5m: Record<string, number> = {};
  const prev55mAvgPer5m: Record<string, number> = {};

  // Keys are stored as `${dim}:count:s${sr}` so a dashboard can scale by 1/sr.
  const keys: string[] = [];
  const keyIndex: { dimId: string; minuteIdx: number }[] = [];
  for (const dim of DIMENSIONS) {
    series[dim.id] = new Array(minutes.length).fill(0);
    for (let i = 0; i < minutes.length; i++) {
      keys.push(usageMinuteBucketKey(minutes[i], `${dim.id}:count:s${sr}`));
      keyIndex.push({ dimId: dim.id, minuteIdx: i });
    }
  }

  const values = (await kvMGet<number>(keys)) ?? keys.map(() => null);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const { dimId, minuteIdx } = keyIndex[i];
    series[dimId][minuteIdx] = v;
  }

  const scale = sr > 0 ? 1 / sr : 1;
  for (const dim of DIMENSIONS) {
    const arr = series[dim.id];
    const sum60 = arr.reduce((a, b) => a + b, 0);
    const sum5 = arr.slice(-5).reduce((a, b) => a + b, 0);
    const prev55 = arr.slice(0, -5).reduce((a, b) => a + b, 0);
    totals[dim.id] = Math.round(sum60 * scale);
    last5m[dim.id] = Math.round(sum5 * scale);
    // average per 5 minutes over the previous 55 minutes (11 windows)
    prev55mAvgPer5m[dim.id] = Math.round((prev55 / 11) * scale);
  }

  return NextResponse.json({
    nowIsoMinuteUtc: toIsoMinuteUtc(),
    sampleRate: sr,
    minutes,
    dimensions: DIMENSIONS,
    series,
    totals,
    last5m,
    prev55mAvgPer5m,
  });
}

