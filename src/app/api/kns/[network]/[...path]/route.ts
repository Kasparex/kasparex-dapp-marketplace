import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{
  network: string;
  path: string[];
}>;

function normalizeNetwork(network: string): 'mainnet' | 'tn10' {
  const n = String(network || '').trim().toLowerCase();
  if (n === 'tn10' || n === 'testnet' || n === 'testnet-10') return 'tn10';
  return 'mainnet';
}

export async function GET(request: NextRequest, context: { params: Params }) {
  const { network, path } = await context.params;
  const net = normalizeNetwork(network);

  const upstreamBase = `https://api.knsdomains.org/${net}`;
  const upstream = new URL(`/api/v1/${(path || []).map(encodeURIComponent).join('/')}`, upstreamBase);

  // forward query string
  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  const res = await fetch(upstream.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    // cache lightly at the edge
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

