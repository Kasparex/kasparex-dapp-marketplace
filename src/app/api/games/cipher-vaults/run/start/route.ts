import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Legacy run routes are unused. Cipher Vaults v3 is client-side covenant + levels. */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Cipher Vaults v3 uses client-side levels. Re-open from Calculation breakdown.' },
    { status: 410 },
  );
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ ok: true, run: null, deprecated: true });
}
