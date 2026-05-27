import { NextRequest, NextResponse } from 'next/server';
import { getInsUpstreamUrl } from '@/lib/ins/config';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const upstream = getInsUpstreamUrl('resolve', { name });

  const res = await fetch(upstream, {
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
