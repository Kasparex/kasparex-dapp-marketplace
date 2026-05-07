import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.KASPAREX_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_KASPAREX_API_URL ||
  'https://api.kasparex.com';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')?.trim() ?? '';
  if (!wallet) {
    return NextResponse.json({ error: 'missing wallet' }, { status: 400 });
  }
  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/balance?wallet=${encodeURIComponent(wallet)}`;
  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'upstream_failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
