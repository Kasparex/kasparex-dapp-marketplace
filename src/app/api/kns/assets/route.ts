import { NextRequest, NextResponse } from 'next/server';

function normalizeNetwork(raw: string | null): 'mainnet' | 'tn10' {
  const n = String(raw || '').trim().toLowerCase();
  if (n === 'tn10' || n === 'testnet' || n === 'testnet-10') return 'tn10';
  return 'mainnet';
}

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get('owner');
  if (!owner) {
    return NextResponse.json({ error: 'owner is required' }, { status: 400 });
  }

  const net = normalizeNetwork(request.nextUrl.searchParams.get('network'));
  const upstream = new URL('https://api.knsdomains.org/');
  upstream.pathname = `/${net}/api/v1/assets`;
  upstream.searchParams.set('owner', owner);

  const res = await fetch(upstream.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

