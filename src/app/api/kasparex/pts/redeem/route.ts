import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.KASPAREX_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_KASPAREX_API_URL ||
  'https://api.kasparex.com';

/**
 * Proxies to Worker /kasparex/pts/redeem. Locked behind server bearer.
 * Use from trusted server code only (Server Actions / internal tools), never expose the bearer to the browser.
 */
export async function POST(req: NextRequest) {
  const internal = process.env.KASPAREX_PTS_INTERNAL_BEARER;
  if (!internal || req.headers.get('authorization') !== `Bearer ${internal}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const secret = process.env.PTS_REDEEM_SECRET?.trim() || process.env.PTS_INGEST_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        error: 'redeem_not_configured',
        detail: 'Set PTS_REDEEM_SECRET and/or PTS_INGEST_SECRET to match the Worker.',
      },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/redeem`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pts-Redeem-Secret': secret,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'upstream_failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
