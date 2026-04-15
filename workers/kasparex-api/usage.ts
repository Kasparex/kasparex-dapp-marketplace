import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

type UsageHitBody = {
  minute: string; // YYYY-MM-DDTHH:MM (UTC)
  dim: string;
  sampleRate: number;
};

type SnapshotResponse = {
  nowIsoMinuteUtc: string;
  sampleRate: number;
  minutes: string[];
  dimensions: { id: string; label: string }[];
  series: Record<string, number[]>;
  totals: Record<string, number>;
  last5m: Record<string, number>;
  prev55mAvgPer5m: Record<string, number>;
};

const DIMENSIONS = [
  { id: 'api.leaderboard.finalize', label: 'Leaderboard finalize (cron)' },
  { id: 'api.updates', label: 'Updates feed' },
  { id: 'api.leaderboard.other', label: 'Leaderboard other' },
  { id: 'api.kaspa', label: 'Kaspa API' },
  { id: 'api.other', label: 'Other API' },
] as const;

function isoMinuteUtc(ms: number = Date.now()): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function minutesBack(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  now.setUTCSeconds(0, 0);
  for (let i = count - 1; i >= 0; i--) {
    out.push(isoMinuteUtc(now.getTime() - i * 60_000));
  }
  return out;
}

function expectedSecret(env: Env): string {
  // Reuse the same secret name as Vercel side for simplicity.
  return (env as any).USAGE_WORKER_SECRET?.trim?.() ?? '';
}

function secretOk(req: Request, env: Env): boolean {
  const expected = expectedSecret(env);
  if (!expected) return false;
  const got = (req.headers.get('x-usage-secret') ?? '').trim();
  return got === expected;
}

function usageKey(minute: string, dim: string, sampleRate: number): string {
  return `usage:v1:minute:${minute}:${dim}:count:s${sampleRate}`;
}

async function bestEffortIncrement(kv: KVNamespace, key: string, ttlSeconds: number): Promise<void> {
  // Cloudflare KV has no atomic INCR; this is best-effort and good enough for spike detection.
  const raw = await kv.get(key);
  const n = raw ? Number(raw) : 0;
  const next = Number.isFinite(n) ? n + 1 : 1;
  await kv.put(key, String(next), { expirationTtl: ttlSeconds });
}

export async function handleUsageRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const cors = { ...getCorsHeaders(), 'Content-Type': 'application/json' };

  // POST /kasparex/usage/hit
  if (pathname === '/kasparex/usage/hit' && request.method === 'POST') {
    if (!secretOk(request, env)) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: cors });
    const body = (await request.json().catch(() => null)) as UsageHitBody | null;
    if (!body?.minute || !body?.dim || typeof body.sampleRate !== 'number') {
      return new Response(JSON.stringify({ ok: false, error: 'Bad request' }), { status: 400, headers: cors });
    }
    const kv = env.RATE_LIMIT ?? env.KASPAREX_CACHE;
    const ttlSeconds = 6 * 60 * 60;
    await bestEffortIncrement(kv, usageKey(body.minute, body.dim, body.sampleRate), ttlSeconds);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  }

  // GET /kasparex/usage/snapshot?minutes=60&sampleRate=0.1
  if (pathname === '/kasparex/usage/snapshot' && request.method === 'GET') {
    if (!secretOk(request, env)) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: cors });
    const minutesCount = Math.max(5, Math.min(360, Number(url.searchParams.get('minutes') ?? '60') || 60));
    const sr = Number(url.searchParams.get('sampleRate') ?? '0.1') || 0.1;
    const minutes = minutesBack(minutesCount);
    const kv = env.RATE_LIMIT ?? env.KASPAREX_CACHE;

    const series: Record<string, number[]> = {};
    const totals: Record<string, number> = {};
    const last5m: Record<string, number> = {};
    const prev55mAvgPer5m: Record<string, number> = {};

    for (const dim of DIMENSIONS) {
      const arr: number[] = [];
      for (const m of minutes) {
        const v = await kv.get(usageKey(m, dim.id, sr));
        const n = v ? Number(v) : 0;
        arr.push(Number.isFinite(n) ? n : 0);
      }
      series[dim.id] = arr;
      const sum = arr.reduce((a, b) => a + b, 0);
      const sum5 = arr.slice(-5).reduce((a, b) => a + b, 0);
      const prev = arr.slice(0, -5).reduce((a, b) => a + b, 0);
      const scale = sr > 0 ? 1 / sr : 1;
      totals[dim.id] = Math.round(sum * scale);
      last5m[dim.id] = Math.round(sum5 * scale);
      // average per 5m over previous windows (if <60m, still works)
      const windows = Math.max(1, Math.floor((arr.length - 5) / 5));
      prev55mAvgPer5m[dim.id] = Math.round((prev / windows) * scale);
    }

    const payload: SnapshotResponse = {
      nowIsoMinuteUtc: isoMinuteUtc(),
      sampleRate: sr,
      minutes,
      dimensions: [...DIMENSIONS],
      series,
      totals,
      last5m,
      prev55mAvgPer5m,
    };
    return new Response(JSON.stringify(payload), { status: 200, headers: cors });
  }

  // POST /kasparex/internal/lock?name=...&ttl=600
  if (pathname === '/kasparex/internal/lock' && request.method === 'POST') {
    if (!secretOk(request, env)) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: cors });
    const name = (url.searchParams.get('name') ?? '').trim();
    const ttl = Math.max(5, Math.min(3600, Number(url.searchParams.get('ttl') ?? '600') || 600));
    if (!name) return new Response(JSON.stringify({ ok: false, error: 'Missing name' }), { status: 400, headers: cors });
    const kv = env.RATE_LIMIT ?? env.KASPAREX_CACHE;
    const key = `locks:v1:${name}`;
    const existing = await kv.get(key);
    if (existing) return new Response(JSON.stringify({ ok: true, acquired: false }), { status: 200, headers: cors });
    await kv.put(key, '1', { expirationTtl: ttl });
    return new Response(JSON.stringify({ ok: true, acquired: true }), { status: 200, headers: cors });
  }

  // POST /kasparex/internal/ratelimit?name=...&ttl=120&limit=5
  if (pathname === '/kasparex/internal/ratelimit' && request.method === 'POST') {
    if (!secretOk(request, env)) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: cors });
    const name = (url.searchParams.get('name') ?? '').trim();
    const ttl = Math.max(5, Math.min(3600, Number(url.searchParams.get('ttl') ?? '120') || 120));
    const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get('limit') ?? '5') || 5));
    if (!name) return new Response(JSON.stringify({ ok: false, error: 'Missing name' }), { status: 400, headers: cors });
    const kv = env.RATE_LIMIT ?? env.KASPAREX_CACHE;
    const key = `rl:v1:${name}`;
    const raw = await kv.get(key);
    const n = raw ? Number(raw) : 0;
    const next = Number.isFinite(n) ? n + 1 : 1;
    await kv.put(key, String(next), { expirationTtl: ttl });
    return new Response(JSON.stringify({ ok: true, allowed: next <= limit, count: next, limit }), { status: 200, headers: cors });
  }

  return new Response('Not found', { status: 404, headers: cors });
}

