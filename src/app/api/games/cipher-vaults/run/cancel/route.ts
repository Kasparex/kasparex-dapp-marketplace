import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true, deprecated: true });
}
