import { NextRequest, NextResponse } from 'next/server';
import { getInsApiBase } from '@/lib/ins/config';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const upstream = new URL('/resolve', getInsApiBase());
  upstream.searchParams.set('name', name);

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
