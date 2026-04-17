import { NextRequest, NextResponse } from 'next/server';
import { parseKpxJson } from '@/lib/kpx/decode';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { json?: string };
    const json = String(body.json ?? '').trim();
    if (!json) return NextResponse.json({ ok: false, error: 'Missing json' }, { status: 400 });
    const parsed = parseKpxJson(json);
    return NextResponse.json({
      ok: true,
      record: parsed.record,
      byteLength: parsed.byteLength,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Invalid record' },
      { status: 400 }
    );
  }
}

