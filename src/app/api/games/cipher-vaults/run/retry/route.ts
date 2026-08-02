import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Cipher Vaults v3 uses client-side levels.' },
    { status: 410 },
  );
}
