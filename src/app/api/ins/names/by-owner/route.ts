import { NextRequest, NextResponse } from 'next/server';
import { getInsApiBase } from '@/lib/ins/config';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  const upstream = new URL('/names/by-owner', getInsApiBase());
  upstream.searchParams.set('address', address);

  const res = await fetch(upstream.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
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
